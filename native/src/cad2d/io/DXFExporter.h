#pragma once

#include "../Database.h"
#include <string>
#include <sstream>
#include <iomanip>

class DXFExporter {
public:
    static std::string exportDXF(const Database& db);
};
