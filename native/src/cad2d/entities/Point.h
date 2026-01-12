#pragma once
#include "Entity.h"
#include <algorithm>

// PointEntity - A simple point marker
class PointEntity : public Entity {
public:
    Point position;

    PointEntity(Point p) : position(p) {}

    EntityType getType() const override { return EntityType::POINT; }

    std::vector<SnapPoint> getSnapPoints() const override {
        return {{position, SnapType::NODE}};
    }

    bool hitTest(double x, double y, double tolerance) const override {
        double dx = x - position.x;
        double dy = y - position.y;
        return (dx*dx + dy*dy) <= (tolerance * tolerance);
    }

    void translate(double dx, double dy) override {
        position.x += dx;
        position.y += dy;
    }

    bool isFullyInside(double x1, double y1, double x2, double y2) const override {
        double minX = std::min(x1, x2);
        double maxX = std::max(x1, x2);
        double minY = std::min(y1, y2);
        double maxY = std::max(y1, y2);
        return position.x >= minX && position.x <= maxX && position.y >= minY && position.y <= maxY;
    }

    bool intersectsRectangle(double x1, double y1, double x2, double y2) const override {
        return isFullyInside(x1, y1, x2, y2);
    }

    void rotate(double cx, double cy, double angle) override {
        double dx = position.x - cx;
        double dy = position.y - cy;
        position.x = cx + dx * std::cos(angle) - dy * std::sin(angle);
        position.y = cy + dx * std::sin(angle) + dy * std::cos(angle);
    }

    void scale(double cx, double cy, double factor) override {
        position.x = cx + (position.x - cx) * factor;
        position.y = cy + (position.y - cy) * factor;
    }

    void mirror(double x1, double y1, double x2, double y2) override {
        mirrorPoint(position, x1, y1, x2, y2);
    }

    std::unique_ptr<Entity> offset(double distance, bool outward) const override {
        return nullptr; // Points don't offset
    }

    std::vector<Point> getIntersections(const Entity* other) const override {
        return {}; // Points don't intersect
    }
};
