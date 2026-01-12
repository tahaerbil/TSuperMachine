#pragma once
#include "Entity.h"
#include <algorithm>

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
