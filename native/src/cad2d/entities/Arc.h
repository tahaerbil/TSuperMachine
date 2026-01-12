#pragma once
#include "Entity.h"
#include <algorithm>

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
        
        // Let's reflect start and end points
        double sx = center.x + radius * std::cos(startAngle);
        double sy = center.y + radius * std::sin(startAngle);
        
        double ex = center.x + radius * std::cos(endAngle);
        double ey = center.y + radius * std::sin(endAngle);
        
        Point ps = {sx, sy};
        Point pe = {ex, ey};
        
        mirrorPoint(ps, x1, y1, x2, y2);
        mirrorPoint(pe, x1, y1, x2, y2);
        
        // Recalculate angles from new center to new points
        startAngle = std::atan2(ps.y - center.y, ps.x - center.x);
        endAngle = std::atan2(pe.y - center.y, pe.x - center.x);
        
        std::swap(startAngle, endAngle);
    }

    std::unique_ptr<Entity> offset(double distance, bool outward) const override {
        // For arc, offset means changing radius (like circle)
        double newRadius = outward ? radius + distance : radius - distance;
        
        if (newRadius <= 0) return nullptr; // Invalid offset
        
        return std::make_unique<ArcEntity>(center, newRadius, startAngle, endAngle);
    }

    std::vector<Point> getIntersections(const Entity* other) const override {
        // TODO: Implement arc intersections
        return {};
    }
};
