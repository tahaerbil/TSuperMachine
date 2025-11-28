#pragma once
#include <cmath>
#include <vector>
#include <string>
#include <memory>

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
    RECTANGLE = 5
};

// Snap Types
enum class SnapType {
    NONE = 0,
    ENDPOINT = 1,
    MIDPOINT = 2,
    CENTER = 3,
    QUADRANT = 4,
    INTERSECTION = 5
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
    
    unsigned int id = 0;
    unsigned int layerId = 0;
    Color color = {1.0f, 1.0f, 1.0f, 1.0f}; // Default White (for dark mode)
    bool selected = false;
    bool visible = true;
};

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
};
