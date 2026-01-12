#pragma once
#include "Entity.h"
#include <algorithm>

// SplineEntity - Cubic spline through control points
class SplineEntity : public Entity {
public:
    std::vector<Point> controlPoints;

    SplineEntity(const std::vector<Point>& pts) : controlPoints(pts) {}

    EntityType getType() const override { return EntityType::SPLINE; }

    std::vector<SnapPoint> getSnapPoints() const override {
        std::vector<SnapPoint> snaps;
        for (const auto& pt : controlPoints) {
            snaps.push_back({pt, SnapType::ENDPOINT});
        }
        return snaps;
    }

    bool hitTest(double x, double y, double tolerance) const override {
        // Simplified: check distance to control points connecting line
        for (size_t i = 0; i < controlPoints.size() - 1; ++i) {
            const Point& p1 = controlPoints[i];
            const Point& p2 = controlPoints[i+1];
            double dx = p2.x - p1.x;
            double dy = p2.y - p1.y;
            double len2 = dx*dx + dy*dy;
            if (len2 == 0) continue;
            double t = ((x - p1.x)*dx + (y - p1.y)*dy) / len2;
            t = std::max(0.0, std::min(1.0, t));
            double cx = p1.x + t*dx, cy = p1.y + t*dy;
            double dist2 = (x-cx)*(x-cx) + (y-cy)*(y-cy);
            if (dist2 <= tolerance*tolerance) return true;
        }
        return false;
    }

    void translate(double dx, double dy) override {
        for (auto& pt : controlPoints) {
            pt.x += dx;
            pt.y += dy;
        }
    }

    bool isFullyInside(double x1, double y1, double x2, double y2) const override {
        double minX = std::min(x1, x2);
        double maxX = std::max(x1, x2);
        double minY = std::min(y1, y2);
        double maxY = std::max(y1, y2);
        for (const auto& pt : controlPoints) {
            if (pt.x < minX || pt.x > maxX || pt.y < minY || pt.y > maxY) return false;
        }
        return true;
    }

    bool intersectsRectangle(double x1, double y1, double x2, double y2) const override {
        double minX = std::min(x1, x2);
        double maxX = std::max(x1, x2);
        double minY = std::min(y1, y2);
        double maxY = std::max(y1, y2);
        for (const auto& pt : controlPoints) {
            if (pt.x >= minX && pt.x <= maxX && pt.y >= minY && pt.y <= maxY) return true;
        }
        return false;
    }

    void rotate(double cx, double cy, double angle) override {
        for (auto& pt : controlPoints) {
            double dx = pt.x - cx;
            double dy = pt.y - cy;
            pt.x = cx + dx * std::cos(angle) - dy * std::sin(angle);
            pt.y = cy + dx * std::sin(angle) + dy * std::cos(angle);
        }
    }

    void scale(double cx, double cy, double factor) override {
        for (auto& pt : controlPoints) {
            pt.x = cx + (pt.x - cx) * factor;
            pt.y = cy + (pt.y - cy) * factor;
        }
    }

    void mirror(double x1, double y1, double x2, double y2) override {
        for (auto& pt : controlPoints) {
            mirrorPoint(pt, x1, y1, x2, y2);
        }
    }

    std::unique_ptr<Entity> offset(double distance, bool outward) const override {
        return nullptr; // Complex spline offset not implemented
    }

    std::vector<Point> getIntersections(const Entity* other) const override {
        return {}; // TODO: Spline intersections
    }
};
