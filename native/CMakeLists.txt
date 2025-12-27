cmake_minimum_required(VERSION 3.15)
project(tsupermachine-native VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# Options
option(BUILD_NODE_ADDON "Build Node.js native addon" ON)
option(BUILD_TESTS "Build tests" OFF)

# Include directories
include_directories(${CMAKE_SOURCE_DIR}/src)

# ============================================================================
# CAD2D Engine Library (Core - Platform Independent)
# ============================================================================
add_library(cad2d_core STATIC
    src/cad2d/Engine.cpp
)

target_include_directories(cad2d_core PUBLIC
    ${CMAKE_SOURCE_DIR}/src/cad2d
)

# Enable PIC for static lib to be linked into shared lib
set_target_properties(cad2d_core PROPERTIES POSITION_INDEPENDENT_CODE ON)

# ============================================================================
# Node.js Native Addon (for Electron)
# ============================================================================
if(BUILD_NODE_ADDON)
    # Find node-addon-api include path
    execute_process(
        COMMAND node -p "require('node-addon-api').include"
        WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
        OUTPUT_VARIABLE NODE_ADDON_API_DIR
        OUTPUT_STRIP_TRAILING_WHITESPACE
    )
    # Remove quotes from the path
    string(REPLACE "\"" "" NODE_ADDON_API_DIR ${NODE_ADDON_API_DIR})
    
    # Include directories for Node.js addon
    include_directories(${CMAKE_JS_INC})
    include_directories(${NODE_ADDON_API_DIR})
    
    # Define NAPI_VERSION
    add_definitions(-DNAPI_VERSION=8)
    
    add_library(cad_addon SHARED
        src/bindings/node/addon.cpp
    )
    
    target_link_libraries(cad_addon PRIVATE
        cad2d_core
        ${CMAKE_JS_LIB}
    )
    
    # Set output name and properties for Node.js addon
    set_target_properties(cad_addon PROPERTIES
        PREFIX ""
        SUFFIX ".node"
        OUTPUT_NAME "cad_addon"
    )
    
    # Platform-specific settings
    if(APPLE)
        set_target_properties(cad_addon PROPERTIES
            LINK_FLAGS "-undefined dynamic_lookup"
        )
    endif()
    
    # Linux specific - nothing special needed for shared libs
    # Node.js will resolve symbols at runtime
endif()

# ============================================================================
# Future: OpenCASCADE 3D Engine (commented out for now)
# ============================================================================
# find_package(OpenCASCADE REQUIRED)
# add_library(cad3d_core STATIC
#     src/cad3d/Kernel.cpp
# )
# target_link_libraries(cad3d_core PUBLIC ${OpenCASCADE_LIBRARIES})

message(STATUS "===========================================")
message(STATUS "TSuperMachine Native Build Configuration")
message(STATUS "===========================================")
message(STATUS "Build Node Addon: ${BUILD_NODE_ADDON}")
message(STATUS "Build Tests: ${BUILD_TESTS}")
message(STATUS "===========================================")
