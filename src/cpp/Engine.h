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
};
