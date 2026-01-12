#pragma once
#include "Entity.h"
#include <algorithm>

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
