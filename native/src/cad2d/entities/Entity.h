#pragma once
#include "../common/GeometryTypes.h"
#include <vector>
#include <memory>

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
