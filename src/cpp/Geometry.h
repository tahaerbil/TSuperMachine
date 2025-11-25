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

// Base Entity Class
class Entity {
public:
    virtual ~Entity() = default;
    virtual EntityType getType() const = 0;
    
    unsigned int id = 0;
    unsigned int layerId = 0;
    Color color = {0.0f, 0.0f, 0.0f, 1.0f}; // Default black
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
};

// Circle Entity
class CircleEntity : public Entity {
public:
    Point center;
    double radius;

    CircleEntity(Point c, double r) : center(c), radius(r) {}

    EntityType getType() const override { return EntityType::CIRCLE; }
};
