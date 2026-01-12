#pragma once
#include "../common/GeometryTypes.h"
#include <vector>
#include <cmath>

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
