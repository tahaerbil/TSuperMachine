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
    TEXT = 4
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
