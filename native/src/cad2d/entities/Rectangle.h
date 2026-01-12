#pragma once
#include "Entity.h"
#include <algorithm>

// Rectangle Entity
class RectangleEntity : public Entity {
public:
    Point p1, p2; // Diagonal corners

    RectangleEntity(const Point& corner1, const Point& corner2)
        : p1(corner1), p2(corner2) {}

    EntityType getType() const override { return EntityType::RECTANGLE; }

    std::vector<SnapPoint> getSnapPoints() const override {
        std::vector<SnapPoint> snaps;
        
        double minX = std::min(p1.x, p2.x);
        double maxX = std::max(p1.x, p2.x);
        double minY = std::min(p1.y, p2.y);
        double maxY = std::max(p1.y, p2.y);
        
        // Corners
        snaps.push_back({{minX, minY}, SnapType::ENDPOINT});
        snaps.push_back({{maxX, minY}, SnapType::ENDPOINT});
        snaps.push_back({{maxX, maxY}, SnapType::ENDPOINT});
        snaps.push_back({{minX, maxY}, SnapType::ENDPOINT});
        
        // Midpoints
        snaps.push_back({{(minX + maxX) / 2.0, minY}, SnapType::MIDPOINT});
        snaps.push_back({{maxX, (minY + maxY) / 2.0}, SnapType::MIDPOINT});
        snaps.push_back({{(minX + maxX) / 2.0, maxY}, SnapType::MIDPOINT});
        snaps.push_back({{minX, (minY + maxY) / 2.0}, SnapType::MIDPOINT});
        
        // Center
        snaps.push_back({{(minX + maxX) / 2.0, (minY + maxY) / 2.0}, SnapType::CENTER});
        
        return snaps;
    }

    bool hitTest(double x, double y, double tolerance) const override {
        double minX = std::min(p1.x, p2.x);
        double maxX = std::max(p1.x, p2.x);
        double minY = std::min(p1.y, p2.y);
        double maxY = std::max(p1.y, p2.y);
        
        // Check distance to 4 segments
        // Bottom
        if (pointToSegmentDistance(x, y, {minX, minY}, {maxX, minY}) <= tolerance) return true;
        // Right
        if (pointToSegmentDistance(x, y, {maxX, minY}, {maxX, maxY}) <= tolerance) return true;
        // Top
        if (pointToSegmentDistance(x, y, {maxX, maxY}, {minX, maxY}) <= tolerance) return true;
        // Left
        if (pointToSegmentDistance(x, y, {minX, maxY}, {minX, minY}) <= tolerance) return true;
        
        return false;
    }

    void translate(double dx, double dy) override {
        p1.x += dx;
        p1.y += dy;
        p2.x += dx;
        p2.y += dy;
    }

    bool isFullyInside(double x1, double y1, double x2, double y2) const override {
        double minX = std::min(x1, x2);
        double maxX = std::max(x1, x2);
        double minY = std::min(y1, y2);
        double maxY = std::max(y1, y2);
        
        // All 4 corners must be inside
        double rectMinX = std::min(p1.x, p2.x);
        double rectMaxX = std::max(p1.x, p2.x);
        double rectMinY = std::min(p1.y, p2.y);
        double rectMaxY = std::max(p1.y, p2.y);
        
        return rectMinX >= minX && rectMaxX <= maxX &&
               rectMinY >= minY && rectMaxY <= maxY;
    }

    bool intersectsRectangle(double x1, double y1, double x2, double y2) const override {
        double minX = std::min(x1, x2);
        double maxX = std::max(x1, x2);
        double minY = std::min(y1, y2);
        double maxY = std::max(y1, y2);
        
        double rectMinX = std::min(p1.x, p2.x);
        double rectMaxX = std::max(p1.x, p2.x);
        double rectMinY = std::min(p1.y, p2.y);
        double rectMaxY = std::max(p1.y, p2.y);
        
        // Check if rectangles overlap
        return !(rectMaxX < minX || rectMinX > maxX ||
                 rectMaxY < minY || rectMinY > maxY);
    }

    void rotate(double cx, double cy, double angle) override {
        // Rotate both corner points
        double dx1 = p1.x - cx;
        double dy1 = p1.y - cy;
        p1.x = cx + dx1 * std::cos(angle) - dy1 * std::sin(angle);
        p1.y = cy + dx1 * std::sin(angle) + dy1 * std::cos(angle);
        
        double dx2 = p2.x - cx;
        double dy2 = p2.y - cy;
        p2.x = cx + dx2 * std::cos(angle) - dy2 * std::sin(angle);
        p2.y = cy + dx2 * std::sin(angle) + dy2 * std::cos(angle);
    }

    void scale(double cx, double cy, double factor) override {
        p1.x = cx + (p1.x - cx) * factor;
        p1.y = cy + (p1.y - cy) * factor;
        p2.x = cx + (p2.x - cx) * factor;
        p2.y = cy + (p2.y - cy) * factor;
    }

    void mirror(double x1, double y1, double x2, double y2) override {
        mirrorPoint(p1, x1, y1, x2, y2);
        mirrorPoint(p2, x1, y1, x2, y2);
    }

    std::unique_ptr<Entity> offset(double distance, bool outward) const override {
        // For rectangle, offset all edges inward or outward
        double minX = std::min(p1.x, p2.x);
        double maxX = std::max(p1.x, p2.x);
        double minY = std::min(p1.y, p2.y);
        double maxY = std::max(p1.y, p2.y);
        
        Point newP1, newP2;
        if (outward) {
            newP1 = { minX - distance, minY - distance };
            newP2 = { maxX + distance, maxY + distance };
        } else {
            newP1 = { minX + distance, minY + distance };
            newP2 = { maxX - distance, maxY - distance };
            
            // Check if rectangle becomes invalid
            if (newP1.x >= newP2.x || newP1.y >= newP2.y) return nullptr;
        }
        
        return std::make_unique<RectangleEntity>(newP1, newP2);
    }

    std::vector<Point> getIntersections(const Entity* other) const override {
        return {}; // Default implementation
    }

private:
    double pointToSegmentDistance(double px, double py, const Point& p1, const Point& p2) const {
        double dx = p2.x - p1.x;
        double dy = p2.y - p1.y;
        double len2 = dx * dx + dy * dy;
        
        if (len2 == 0.0) {
            dx = px - p1.x;
            dy = py - p1.y;
            return std::sqrt(dx * dx + dy * dy);
        }
        
        double t = ((px - p1.x) * dx + (py - p1.y) * dy) / len2;
        t = std::max(0.0, std::min(1.0, t));
        
        double closestX = p1.x + t * dx;
        double closestY = p1.y + t * dy;
        
        dx = px - closestX;
        dy = py - closestY;
        return std::sqrt(dx * dx + dy * dy);
    }
};
