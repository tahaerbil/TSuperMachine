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
};

