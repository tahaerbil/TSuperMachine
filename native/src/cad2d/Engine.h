#pragma once
#include "Database.h"
#include <vector>

class Engine {
private:
    Database db;
    std::vector<float> renderBuffer;

public:
    Engine();
    
    // Drawing Commands
    unsigned int addLine(double x1, double y1, double x2, double y2);
    unsigned int addCircle(double cx, double cy, double radius);
    unsigned int addPolyline(const std::vector<Point>& points, bool closed);
    unsigned int addRectangle(double x1, double y1, double x2, double y2);
    unsigned int addArc(double cx, double cy, double radius, double startAngle, double endAngle);
    unsigned int addRegularPolygon(double cx, double cy, int sides, double radius);
    
    // Serialization
    std::string exportDatabase();
    void importDatabase(const std::string& json);
    
    // Modification
    void clear();
    void deleteEntity(unsigned int id);
    
    // Rendering
    // Returns a flat buffer for JS to consume: [Type, Data..., Color...]
    const std::vector<float>& getRenderBuffer();

    // Snapping
    SnapPoint findClosestSnapPoint(double x, double y, double threshold);

    // Selection
    int hitTest(double x, double y, double threshold); // Returns Entity ID or -1
    void selectEntity(unsigned int id);
    void deselectAll();
    void deleteSelected();
    void moveSelected(double dx, double dy);
    void copySelected(double dx, double dy);
    void selectByWindow(double x1, double y1, double x2, double y2);
    void selectByCrossing(double x1, double y1, double x2, double y2);
    void rotateSelected(double cx, double cy, double angle);
    unsigned int offsetEntity(unsigned int id, double distance, double clickX, double clickY);
    
    // Spatial Queries
};
