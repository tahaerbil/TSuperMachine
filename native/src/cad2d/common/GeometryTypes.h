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

// Basic Types
struct Point {
    double x, y;
};

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

// Helper function
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
