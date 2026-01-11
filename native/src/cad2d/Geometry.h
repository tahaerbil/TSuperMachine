#pragma once
#include <cmath>
#include <vector>
#include <string>
#include <memory>
#include <optional>
#include <algorithm>

// Math Constants
#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

namespace MathUtils {
    inline double distSq(const Point& p1, const Point& p2) {
        double dx = p1.x - p2.x;
        double dy = p1.y - p2.y;
        return dx*dx + dy*dy;
    }

    inline double dist(const Point& p1, const Point& p2) {
        return std::sqrt(distSq(p1, p2));
    }
}

// Basic Types
struct Point {
    double x, y;
};

struct Vector {
    double x, y;
};

struct Color {
    float r, g, b, a;
};

// Entity Types
enum class EntityType {
    LINE = 0,
    CIRCLE = 1,
    ARC = 2,
    POLYLINE = 3,
    TEXT = 4,
    RECTANGLE = 5,
    ELLIPSE = 6,
    POINT = 7,
    SPLINE = 8
};

// Snap Types
enum class SnapType {
    NONE = 0,
    ENDPOINT = 1,
    MIDPOINT = 2,
    CENTER = 3,
    QUADRANT = 4,
    INTERSECTION = 5,
    NODE = 6
};

struct SnapPoint {
    Point p;
    SnapType type;
};

// Base Entity Class
class Entity {
public:
    virtual ~Entity() = default;
    virtual EntityType getType() const = 0;
    virtual std::vector<SnapPoint> getSnapPoints() const = 0;
    virtual bool hitTest(double x, double y, double tolerance) const = 0;
    virtual void translate(double dx, double dy) = 0;
    virtual bool isFullyInside(double x1, double y1, double x2, double y2) const = 0;
    virtual bool intersectsRectangle(double x1, double y1, double x2, double y2) const = 0;
    virtual void rotate(double cx, double cy, double angle) = 0;
    virtual void scale(double cx, double cy, double factor) = 0;
    virtual void mirror(double x1, double y1, double x2, double y2) = 0;
    virtual std::unique_ptr<Entity> offset(double distance, bool outward) const = 0;
    virtual std::vector<Point> getIntersections(const Entity* other) const = 0;
    
    unsigned int id = 0;
    unsigned int layerId = 0;
    Color color = {1.0f, 1.0f, 1.0f, 1.0f}; // Default White (for dark mode)
    bool selected = false;
    bool visible = true;
};

// Forward declaration of helper
inline void mirrorPoint(Point& p, double x1, double y1, double x2, double y2) {
    double dx = x2 - x1;
    double dy = y2 - y1;
    double a = (dx * dx - dy * dy);
    double b = 2 * dx * dy;
    double c = (dx * dx + dy * dy);
    
    if (c == 0) return; // Points overlap

    double p_x = p.x - x1;
    double p_y = p.y - y1;
    
    p.x = x1 + (a * p_x + b * p_y) / c;
    p.y = y1 + (b * p_x - a * p_y) / c;
}

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

    std::vector<Point> getIntersections(const Entity* other) const override; // Defined below to avoid circular checks


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

// Circle Entity
class CircleEntity : public Entity {
public:
    Point center;
    double radius;

    CircleEntity(Point c, double r) : center(c), radius(r) {}

    EntityType getType() const override { return EntityType::CIRCLE; }

    std::vector<SnapPoint> getSnapPoints() const override {
        std::vector<SnapPoint> snaps;
        snaps.push_back({center, SnapType::CENTER});
        snaps.push_back({{center.x + radius, center.y}, SnapType::QUADRANT});
        snaps.push_back({{center.x - radius, center.y}, SnapType::QUADRANT});
        snaps.push_back({{center.x, center.y + radius}, SnapType::QUADRANT});
        snaps.push_back({{center.x, center.y - radius}, SnapType::QUADRANT});
        return snaps;
    }

    bool hitTest(double x, double y, double tolerance) const override {
        double dx = x - center.x;
        double dy = y - center.y;
        double dist = std::sqrt(dx * dx + dy * dy);
        return std::abs(dist - radius) <= tolerance;
    }

    void translate(double dx, double dy) override {
        center.x += dx;
        center.y += dy;
    }

    bool isFullyInside(double x1, double y1, double x2, double y2) const override {
        double minX = std::min(x1, x2);
        double maxX = std::max(x1, x2);
        double minY = std::min(y1, y2);
        double maxY = std::max(y1, y2);
        
        // Circle is fully inside if its bounding box is inside
        return (center.x - radius >= minX && center.x + radius <= maxX &&
                center.y - radius >= minY && center.y + radius <= maxY);
    }

    bool intersectsRectangle(double x1, double y1, double x2, double y2) const override {
        double minX = std::min(x1, x2);
        double maxX = std::max(x1, x2);
        double minY = std::min(y1, y2);
        double maxY = std::max(y1, y2);
        
        // Find closest point on rectangle to circle center
        double closestX = std::max(minX, std::min(center.x, maxX));
        double closestY = std::max(minY, std::min(center.y, maxY));
        
        // Check distance from circle center to closest point
        double dx = center.x - closestX;
        double dy = center.y - closestY;
        double distSq = dx * dx + dy * dy;
        
        return distSq <= radius * radius;
    }

    void rotate(double cx, double cy, double angle) override {
        // Rotate center point
        double dx = center.x - cx;
        double dy = center.y - cy;
        center.x = cx + dx * std::cos(angle) - dy * std::sin(angle);
        center.y = cy + dx * std::sin(angle) + dy * std::cos(angle);
        // Radius stays the same
    }

    void scale(double cx, double cy, double factor) override {
        center.x = cx + (center.x - cx) * factor;
        center.y = cy + (center.y - cy) * factor;
        radius *= factor;
    }

    void mirror(double x1, double y1, double x2, double y2) override {
        mirrorPoint(center, x1, y1, x2, y2);
        // Radius doesn't change
    }

    std::unique_ptr<Entity> offset(double distance, bool outward) const override {
        // For circle, offset means changing radius
        double newRadius = outward ? radius + distance : radius - distance;
        
        if (newRadius <= 0) return nullptr; // Invalid offset
        
        return std::make_unique<CircleEntity>(center, newRadius);
    }

    std::vector<Point> getIntersections(const Entity* other) const override;
};


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

    std::unique_ptr<Entity> offset(double distance, bool outward) const override {
        // TODO: Implement polyline offset (complex - requires corner handling)
        return nullptr;
    }

    std::vector<Point> getIntersections(const Entity* other) const override;


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

// Rectangle Entity
class RectangleEntity : public Entity {
public:
    Point p1, p2; // Diagonal corners

    RectangleEntity(const Point& corner1, const Point& corner2)
        : p1(corner1), p2(corner2) {}

    EntityType getType() const override { return EntityType::RECTANGLE; }

    std::vector<SnapPoint> getSnapPoints() const override {
        std::vector<SnapPoint> snaps;
        
        double minX = std::min(p1.x, p2.x);
        double maxX = std::max(p1.x, p2.x);
        double minY = std::min(p1.y, p2.y);
        double maxY = std::max(p1.y, p2.y);
        
        // Corners
        snaps.push_back({{minX, minY}, SnapType::ENDPOINT});
        snaps.push_back({{maxX, minY}, SnapType::ENDPOINT});
        snaps.push_back({{maxX, maxY}, SnapType::ENDPOINT});
        snaps.push_back({{minX, maxY}, SnapType::ENDPOINT});
        
        // Midpoints
        snaps.push_back({{(minX + maxX) / 2.0, minY}, SnapType::MIDPOINT});
        snaps.push_back({{maxX, (minY + maxY) / 2.0}, SnapType::MIDPOINT});
        snaps.push_back({{(minX + maxX) / 2.0, maxY}, SnapType::MIDPOINT});
        snaps.push_back({{minX, (minY + maxY) / 2.0}, SnapType::MIDPOINT});
        
        // Center
        snaps.push_back({{(minX + maxX) / 2.0, (minY + maxY) / 2.0}, SnapType::CENTER});
        
        return snaps;
    }

    bool hitTest(double x, double y, double tolerance) const override {
        double minX = std::min(p1.x, p2.x);
        double maxX = std::max(p1.x, p2.x);
        double minY = std::min(p1.y, p2.y);
        double maxY = std::max(p1.y, p2.y);
        
        // Check distance to 4 segments
        // Bottom
        if (pointToSegmentDistance(x, y, {minX, minY}, {maxX, minY}) <= tolerance) return true;
        // Right
        if (pointToSegmentDistance(x, y, {maxX, minY}, {maxX, maxY}) <= tolerance) return true;
        // Top
        if (pointToSegmentDistance(x, y, {maxX, maxY}, {minX, maxY}) <= tolerance) return true;
        // Left
        if (pointToSegmentDistance(x, y, {minX, maxY}, {minX, minY}) <= tolerance) return true;
        
        return false;
    }

    void translate(double dx, double dy) override {
        p1.x += dx;
        p1.y += dy;
        p2.x += dx;
        p2.y += dy;
    }

    bool isFullyInside(double x1, double y1, double x2, double y2) const override {
        double minX = std::min(x1, x2);
        double maxX = std::max(x1, x2);
        double minY = std::min(y1, y2);
        double maxY = std::max(y1, y2);
        
        // All 4 corners must be inside
        double rectMinX = std::min(p1.x, p2.x);
        double rectMaxX = std::max(p1.x, p2.x);
        double rectMinY = std::min(p1.y, p2.y);
        double rectMaxY = std::max(p1.y, p2.y);
        
        return rectMinX >= minX && rectMaxX <= maxX &&
               rectMinY >= minY && rectMaxY <= maxY;
    }

    bool intersectsRectangle(double x1, double y1, double x2, double y2) const override {
        double minX = std::min(x1, x2);
        double maxX = std::max(x1, x2);
        double minY = std::min(y1, y2);
        double maxY = std::max(y1, y2);
        
        double rectMinX = std::min(p1.x, p2.x);
        double rectMaxX = std::max(p1.x, p2.x);
        double rectMinY = std::min(p1.y, p2.y);
        double rectMaxY = std::max(p1.y, p2.y);
        
        // Check if rectangles overlap
        return !(rectMaxX < minX || rectMinX > maxX ||
                 rectMaxY < minY || rectMinY > maxY);
    }

    void rotate(double cx, double cy, double angle) override {
        // Rotate both corner points
        double dx1 = p1.x - cx;
        double dy1 = p1.y - cy;
        p1.x = cx + dx1 * std::cos(angle) - dy1 * std::sin(angle);
        p1.y = cy + dx1 * std::sin(angle) + dy1 * std::cos(angle);
        
        double dx2 = p2.x - cx;
        double dy2 = p2.y - cy;
        p2.x = cx + dx2 * std::cos(angle) - dy2 * std::sin(angle);
        p2.y = cy + dx2 * std::sin(angle) + dy2 * std::cos(angle);
    }

    void scale(double cx, double cy, double factor) override {
        p1.x = cx + (p1.x - cx) * factor;
        p1.y = cy + (p1.y - cy) * factor;
        p2.x = cx + (p2.x - cx) * factor;
        p2.y = cy + (p2.y - cy) * factor;
    }

    void mirror(double x1, double y1, double x2, double y2) override {
        mirrorPoint(p1, x1, y1, x2, y2);
        mirrorPoint(p2, x1, y1, x2, y2);
    }

    std::unique_ptr<Entity> offset(double distance, bool outward) const override {
        // For rectangle, offset all edges inward or outward
        double minX = std::min(p1.x, p2.x);
        double maxX = std::max(p1.x, p2.x);
        double minY = std::min(p1.y, p2.y);
        double maxY = std::max(p1.y, p2.y);
        
        Point newP1, newP2;
        if (outward) {
            newP1 = { minX - distance, minY - distance };
            newP2 = { maxX + distance, maxY + distance };
        } else {
            newP1 = { minX + distance, minY + distance };
            newP2 = { maxX - distance, maxY - distance };
            
            // Check if rectangle becomes invalid
            if (newP1.x >= newP2.x || newP1.y >= newP2.y) return nullptr;
        }
        
        return std::make_unique<RectangleEntity>(newP1, newP2);
    }

    std::vector<Point> getIntersections(const Entity* other) const override;


private:
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

// Arc Entity
class ArcEntity : public Entity {
public:
    Point center;
    double radius;
    double startAngle; // Radians
    double endAngle;   // Radians

    ArcEntity(Point c, double r, double start, double end) 
        : center(c), radius(r), startAngle(start), endAngle(end) {}

    EntityType getType() const override { return EntityType::ARC; }

    std::vector<SnapPoint> getSnapPoints() const override {
        std::vector<SnapPoint> snaps;
        
        // Center
        snaps.push_back({center, SnapType::CENTER});
        
        // Endpoints
        double x1 = center.x + radius * std::cos(startAngle);
        double y1 = center.y + radius * std::sin(startAngle);
        snaps.push_back({{x1, y1}, SnapType::ENDPOINT});
        
        double x2 = center.x + radius * std::cos(endAngle);
        double y2 = center.y + radius * std::sin(endAngle);
        snaps.push_back({{x2, y2}, SnapType::ENDPOINT});
        
        // Midpoint (on the arc)
        // Handle angle wrapping
        double midAngle = (startAngle + endAngle) / 2.0;
        if (startAngle > endAngle) {
            midAngle += M_PI; // Adjust for crossing 0/2PI
        }
        
        double xm = center.x + radius * std::cos(midAngle);
        double ym = center.y + radius * std::sin(midAngle);
        snaps.push_back({{xm, ym}, SnapType::MIDPOINT});
        
        return snaps;
    }

    bool hitTest(double x, double y, double tolerance) const override {
        double dx = x - center.x;
        double dy = y - center.y;
        double dist = std::sqrt(dx * dx + dy * dy);
        
        // Check if distance is within tolerance of radius
        if (std::abs(dist - radius) > tolerance) return false;
        
        // Calculate angle of the point
        double angle = std::atan2(dy, dx);
        
        // Normalize all angles to [0, 2PI)
        auto normalize = [](double a) {
            a = std::fmod(a, 2 * M_PI);
            if (a < 0) a += 2 * M_PI;
            return a;
        };
        
        double a = normalize(angle);
        double s = normalize(startAngle);
        double e = normalize(endAngle);
        
        // Check if angle is within [s, e] in CCW direction (Decreasing Angle in Screen Space)
        // If s > e: Direct range [e, s] (e.g. 90 -> 0)
        // If s < e: Crossing boundary [e, 2PI) U [0, s] (e.g. 0 -> 270)
        
        if (s > e) {
            return a <= s && a >= e;
        } else {
            return a <= s || a >= e;
        }
    }

    void translate(double dx, double dy) override {
        center.x += dx;
        center.y += dy;
    }

    bool isFullyInside(double x1, double y1, double x2, double y2) const override {
        double minX = std::min(x1, x2);
        double maxX = std::max(x1, x2);
        double minY = std::min(y1, y2);
        double maxY = std::max(y1, y2);
        
        // Arc bounding box must be fully inside
        return (center.x - radius >= minX && center.x + radius <= maxX &&
                center.y - radius >= minY && center.y + radius <= maxY);
    }

    bool intersectsRectangle(double x1, double y1, double x2, double y2) const override {
        double minX = std::min(x1, x2);
        double maxX = std::max(x1, x2);
        double minY = std::min(y1, y2);
        double maxY = std::max(y1, y2);
        
        // Simplified: check if arc's bounding circle intersects rectangle
        double closestX = std::max(minX, std::min(center.x, maxX));
        double closestY = std::max(minY, std::min(center.y, maxY));
        
        double dx = center.x - closestX;
        double dy = center.y - closestY;
        double distSq = dx * dx + dy * dy;
        
        return distSq <= radius * radius;
    }

    void rotate(double cx, double cy, double angle) override {
        // Rotate center point
        double dx = center.x - cx;
        double dy = center.y - cy;
        center.x = cx + dx * std::cos(angle) - dy * std::sin(angle);
        center.y = cy + dx * std::sin(angle) + dy * std::cos(angle);
        
        // Rotate start and end angles
        startAngle += angle;
        endAngle += angle;
    }

    void scale(double cx, double cy, double factor) override {
        center.x = cx + (center.x - cx) * factor;
        center.y = cy + (center.y - cy) * factor;
        radius *= factor;
    }

    void mirror(double x1, double y1, double x2, double y2) override {
        mirrorPoint(center, x1, y1, x2, y2);
        
        // Mirroring arc angles is tricky.
        // It effectively flips the direction and angles.
        // New Start = reflects Old Start or Old End depending on axis
        // Simplification: Mirror start/end points then recalculate angles?
        // Or simpler: flip circle center, keep radius, swap start/end angles and mirror them.
        
        // Let's reflect start and end points
        double sx = center.x + radius * std::cos(startAngle);
        double sy = center.y + radius * std::sin(startAngle);
        
        double ex = center.x + radius * std::cos(endAngle);
        double ey = center.y + radius * std::sin(endAngle);
        
        Point ps = {sx, sy};
        Point pe = {ex, ey};
        
        mirrorPoint(ps, x1, y1, x2, y2);
        mirrorPoint(pe, x1, y1, x2, y2); // Oops, center is already mirrored by this call? No, wrapper calls center mirror
        
        // Recalculate angles from new center to new points
        startAngle = std::atan2(ps.y - center.y, ps.x - center.x);
        endAngle = std::atan2(pe.y - center.y, pe.x - center.x);
        
        // Ensure CCW direction? Arc is always CCW from start to end.
        // Mirroring flips chirality, so we might need to swap start/end?
        // Yes, swapping them usually maintains the arc segment.
        std::swap(startAngle, endAngle);
    }

    std::unique_ptr<Entity> offset(double distance, bool outward) const override {
        // For arc, offset means changing radius (like circle)
        double newRadius = outward ? radius + distance : radius - distance;
        
        if (newRadius <= 0) return nullptr; // Invalid offset
        
        return std::make_unique<ArcEntity>(center, newRadius, startAngle, endAngle);
    }
};

// Ellipse Entity
class EllipseEntity : public Entity {
public:
    Point center;
    double majorRadius;
    double minorRadius;
    double rotation; // Radians, angle of major axis

    EllipseEntity(Point c, double major, double minor, double rot) 
        : center(c), majorRadius(major), minorRadius(minor), rotation(rot) {}

    EntityType getType() const override { return EntityType::ELLIPSE; }

    std::vector<SnapPoint> getSnapPoints() const override {
        std::vector<SnapPoint> snaps;
        snaps.push_back({center, SnapType::CENTER});
        
        // Major axis endpoints
        snaps.push_back({
            {center.x + majorRadius * std::cos(rotation), center.y + majorRadius * std::sin(rotation)},
            SnapType::QUADRANT
        });
        snaps.push_back({
            {center.x - majorRadius * std::cos(rotation), center.y - majorRadius * std::sin(rotation)},
            SnapType::QUADRANT
        });
        
        // Minor axis endpoints
        double minorRot = rotation + M_PI / 2.0;
        snaps.push_back({
            {center.x + minorRadius * std::cos(minorRot), center.y + minorRadius * std::sin(minorRot)},
            SnapType::QUADRANT
        });
        snaps.push_back({
            {center.x - minorRadius * std::cos(minorRot), center.y - minorRadius * std::sin(minorRot)},
            SnapType::QUADRANT
        });
        
        return snaps;
    }

    bool hitTest(double x, double y, double tolerance) const override {
        // Transform point to local ellipse space
        double dx = x - center.x;
        double dy = y - center.y;
        
        // Rotate backwards by -rotation
        double locX = dx * std::cos(-rotation) - dy * std::sin(-rotation);
        double locY = dx * std::sin(-rotation) + dy * std::cos(-rotation);
        
        // Check equation (x/a)^2 + (y/b)^2 = 1
        double lhs = (locX * locX) / (majorRadius * majorRadius) + (locY * locY) / (minorRadius * minorRadius);
        
        return std::abs(lhs - 1.0) < (tolerance / std::min(majorRadius, minorRadius)); 
    }

    void translate(double dx, double dy) override {
        center.x += dx;
        center.y += dy;
    }

    bool isFullyInside(double x1, double y1, double x2, double y2) const override {
        // Bounding box approximation
        double minX = std::min(x1, x2);
        double maxX = std::max(x1, x2);
        double minY = std::min(y1, y2);
        double maxY = std::max(y1, y2);
        
        double maxR = std::max(majorRadius, minorRadius);
        return (center.x - maxR >= minX && center.x + maxR <= maxX &&
                center.y - maxR >= minY && center.y + maxR <= maxY);
    }

    bool intersectsRectangle(double x1, double y1, double x2, double y2) const override {
        double maxR = std::max(majorRadius, minorRadius);
        double minX = std::min(x1, x2);
        double maxX = std::max(x1, x2);
        double minY = std::min(y1, y2);
        double maxY = std::max(y1, y2);
        double closestX = std::max(minX, std::min(center.x, maxX));
        double closestY = std::max(minY, std::min(center.y, maxY));
        double dx = center.x - closestX;
        double dy = center.y - closestY;
        return (dx * dx + dy * dy) <= maxR * maxR;
    }

    void rotate(double cx, double cy, double angle) override {
        double dx = center.x - cx;
        double dy = center.y - cy;
        center.x = cx + dx * std::cos(angle) - dy * std::sin(angle);
        center.y = cy + dx * std::sin(angle) + dy * std::cos(angle);
        rotation += angle;
    }

    void scale(double cx, double cy, double factor) override {
        center.x = cx + (center.x - cx) * factor;
        center.y = cy + (center.y - cy) * factor;
        majorRadius *= factor;
        minorRadius *= factor;
    }

    void mirror(double x1, double y1, double x2, double y2) override {
         mirrorPoint(center, x1, y1, x2, y2);
         double lineAngle = std::atan2(y2 - y1, x2 - x1);
         rotation = 2 * lineAngle - rotation;
    }

    std::unique_ptr<Entity> offset(double distance, bool outward) const override {
        double newMj = outward ? majorRadius + distance : majorRadius - distance;
        double newMn = outward ? minorRadius + distance : minorRadius - distance;
        if (newMj <= 0 || newMn <= 0) return nullptr;
        return std::make_unique<EllipseEntity>(center, newMj, newMn, rotation);
    }

    std::vector<Point> getIntersections(const Entity* other) const override { return {}; } // TODO: Implement Ellipse intersection

};

// ============================================================================
// Intersection Logic Implementation
// ============================================================================

namespace Intersect {
    // Line-Line Intersection (Infinite lines)
    inline std::vector<Point> lineLine(Point p1, Point p2, Point p3, Point p4) {
        double det = (p2.x - p1.x) * (p4.y - p3.y) - (p4.x - p3.x) * (p2.y - p1.y);
        if (std::abs(det) < 1e-10) return {}; // Parallel

        double t = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / det;
        return {{ p1.x + t * (p2.x - p1.x), p1.y + t * (p2.y - p1.y) }};
    }

    // Line segment intersection
    inline std::vector<Point> segmentSegment(Point p1, Point p2, Point p3, Point p4) {
         double det = (p2.x - p1.x) * (p4.y - p3.y) - (p4.x - p3.x) * (p2.y - p1.y);
        if (std::abs(det) < 1e-10) return {};

        double t = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / det;
        double u = ((p3.x - p1.x) * (p2.y - p1.y) - (p3.y - p1.y) * (p2.x - p1.x)) / det;

        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
             return {{ p1.x + t * (p2.x - p1.x), p1.y + t * (p2.y - p1.y) }};
        }
        return {};
    }

    // Line-Circle Intersection
    inline std::vector<Point> lineCircle(Point p1, Point p2, Point center, double radius) {
        double dx = p2.x - p1.x;
        double dy = p2.y - p1.y;
        double fx = p1.x - center.x;
        double fy = p1.y - center.y;

        double a = dx*dx + dy*dy;
        double b = 2*(fx*dx + fy*dy);
        double c = (fx*fx + fy*fy) - radius*radius;

        double delta = b*b - 4*a*c;
        
        if (delta < 0) return {};
        
        std::vector<Point> points;
        delta = std::sqrt(delta);
        double t1 = (-b - delta) / (2*a);
        double t2 = (-b + delta) / (2*a);

        if (t1 >= 0 && t1 <= 1) points.push_back({p1.x + t1*dx, p1.y + t1*dy});
        if (t2 >= 0 && t2 <= 1 && std::abs(t2-t1) > 1e-5) points.push_back({p1.x + t2*dx, p1.y + t2*dy});
        
        return points;
    }
}

// Implementation of getIntersections for LineEntity
inline std::vector<Point> LineEntity::getIntersections(const Entity* other) const {
    if (other->getType() == EntityType::LINE) {
        auto* l2 = static_cast<const LineEntity*>(other);
        return Intersect::segmentSegment(start, end, l2->start, l2->end);
    }
    else if (other->getType() == EntityType::CIRCLE) {
        auto* c = static_cast<const CircleEntity*>(other);
        return Intersect::lineCircle(start, end, c->center, c->radius);
    }
    // TODO: Add other types (Arc, Rectangle -> broken into lines)
    return {};
}

// Implementation of getIntersections for CircleEntity
inline std::vector<Point> CircleEntity::getIntersections(const Entity* other) const {
    if (other->getType() == EntityType::LINE) {
        auto* l = static_cast<const LineEntity*>(other);
        return Intersect::lineCircle(l->start, l->end, center, radius);
    }
    // TODO: Circle-Circle
    return {};
}

// Default/Empty implementations for others to fix vtable
inline std::vector<Point> PolylineEntity::getIntersections(const Entity* other) const { return {}; }
inline std::vector<Point> RectangleEntity::getIntersections(const Entity* other) const { return {}; }
inline std::vector<Point> ArcEntity::getIntersections(const Entity* other) const { return {}; }
inline std::vector<Point> PointEntity::getIntersections(const Entity* other) const { return {}; }
inline std::vector<Point> SplineEntity::getIntersections(const Entity* other) const { return {}; }
