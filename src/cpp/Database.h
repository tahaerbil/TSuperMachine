#pragma once
#include "Geometry.h"
#include <vector>
#include <memory>
#include <algorithm>

class Database {
private:
    std::vector<std::unique_ptr<Entity>> entities;
    unsigned int nextId = 1;

public:
    unsigned int addEntity(std::unique_ptr<Entity> entity) {
        entity->id = nextId++;
        unsigned int id = entity->id;
        entities.push_back(std::move(entity));
        return id;
    }

    void clear() {
        entities.clear();
        nextId = 1;
    }

    const std::vector<std::unique_ptr<Entity>>& getEntities() const {
        return entities;
    }

    Entity* getEntity(unsigned int id) {
        auto it = std::find_if(entities.begin(), entities.end(), 
            [id](const auto& e) { return e->id == id; });
        
        if (it != entities.end()) {
            return it->get();
        }
        return nullptr;
    }

    void deleteEntity(unsigned int id) {
        entities.erase(
            std::remove_if(entities.begin(), entities.end(),
                [id](const auto& e) { return e->id == id; }),
            entities.end()
        );
    }
};
