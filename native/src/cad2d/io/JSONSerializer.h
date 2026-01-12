#pragma once

#include "../Database.h"
#include <string>
#include <sstream>
#include <iomanip>

class JSONSerializer {
public:
    static std::string exportDatabase(const Database& db);
    static void importDatabase(Database& db, const std::string& json);

private:
    static std::string getJsonValue(const std::string& json, const std::string& key);
    static double extractNumber(const std::string& str, const std::string& key);
};
