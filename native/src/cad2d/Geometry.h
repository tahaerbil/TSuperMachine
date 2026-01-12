#pragma once

// Common Types & Utils
#include "common/GeometryTypes.h"
#include "utils/IntersectionUtils.h"

// Base Entity
#include "entities/Entity.h"

// Entities
#include "entities/Line.h"
#include "entities/Circle.h"
#include "entities/Arc.h"
#include "entities/Polyline.h"
#include "entities/Rectangle.h"
#include "entities/Ellipse.h"
#include "entities/Point.h"
#include "entities/Spline.h"

// Implementation of getIntersections (Cross-Entity Logic)
// These must be defined here because they depend on multiple entity types being fully defined.

// ----------------------------------------------------------------------------
// LineEntity Implementation
// ----------------------------------------------------------------------------
inline std::vector<Point> LineEntity::getIntersections(const Entity* other) const {
    if (other->getType() == EntityType::LINE) {
        auto* l2 = static_cast<const LineEntity*>(other);
        return Intersect::segmentSegment(start, end, l2->start, l2->end);
    }
    else if (other->getType() == EntityType::CIRCLE) {
        auto* c = static_cast<const CircleEntity*>(other);
        return Intersect::lineCircle(start, end, c->center, c->radius);
    }
    // TODO: Add other types (Arc, Rectangle -> broken into lines)
    return {};
}

// ----------------------------------------------------------------------------
// CircleEntity Implementation
// ----------------------------------------------------------------------------
inline std::vector<Point> CircleEntity::getIntersections(const Entity* other) const {
    if (other->getType() == EntityType::LINE) {
        auto* l = static_cast<const LineEntity*>(other);
        return Intersect::lineCircle(l->start, l->end, center, radius);
    }
    // TODO: Circle-Circle
    return {};
}

// ----------------------------------------------------------------------------
// Default Implementations for other entities (to satisfy vtable)
// ----------------------------------------------------------------------------
/* 
   Note: These were previously inline empty implementations. 
   We keep them here or in the headers. 
   Since they were defined as inline in the headers returning {}, 
   we don't strictly need to redefine them here unless we removed the body in the header.
   
   In my extraction step:
   - PolylineEntity: getIntersections returns {} in body.
   - RectangleEntity: getIntersections returns {} in body.
   - ArcEntity: getIntersections returns {} in body.
   - EllipseEntity: getIntersections returns {} in body.
   - PointEntity: getIntersections returns {} in body.
   - SplineEntity: getIntersections returns {} in body.
   
   So only Line and Circle need implementation here because I removed their bodies in the header 
   (only declared `std::vector<Point> getIntersections(const Entity* other) const override;`).
*/
