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
    src/cad2d/io/JSONSerializer.cpp
    src/cad2d/io/DXFExporter.cpp
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
# CAD3D Engine Library (OpenCASCADE-based Professional 3D Kernel)
# ============================================================================
option(WITH_OPENCASCADE "Build with OpenCASCADE support" OFF)

# Try to find OpenCASCADE automatically
find_package(OpenCASCADE QUIET)

if(OpenCASCADE_FOUND)
    set(WITH_OPENCASCADE ON CACHE BOOL "Build with OpenCASCADE support" FORCE)
    message(STATUS "OpenCASCADE found: ${OpenCASCADE_INCLUDE_DIR}")
endif()

add_library(cad3d_core STATIC
    src/cad3d/CAD3DEngine.cpp
)

target_include_directories(cad3d_core PUBLIC
    ${CMAKE_SOURCE_DIR}/src/cad3d
)

if(WITH_OPENCASCADE AND OpenCASCADE_FOUND)
    target_compile_definitions(cad3d_core PUBLIC HAVE_OPENCASCADE)
    target_include_directories(cad3d_core PUBLIC ${OpenCASCADE_INCLUDE_DIR})
    target_link_libraries(cad3d_core PUBLIC
        TKernel TKMath TKG3d TKBRep TKGeomBase TKGeomAlgo
        TKTopAlgo TKPrim TKMesh TKBO TKShHealing
        TKFillet TKDE TKDESTEP TKDEIGES
    )
    message(STATUS "CAD3D: OpenCASCADE ENABLED (Professional Mode)")
else()
    message(STATUS "CAD3D: OpenCASCADE NOT FOUND (Stub Mode - Limited Functionality)")
endif()

set_target_properties(cad3d_core PROPERTIES POSITION_INDEPENDENT_CODE ON)

# ============================================================================
# CAD3D Node.js Addon
# ============================================================================
if(BUILD_NODE_ADDON)
    add_library(cad3d_addon SHARED
        src/bindings/node/cad3d_addon.cpp
    )
    
    target_include_directories(cad3d_addon PRIVATE
        ${CMAKE_SOURCE_DIR}/src
    )
    
    target_link_libraries(cad3d_addon PRIVATE
        cad3d_core
        ${CMAKE_JS_LIB}
    )
    
    set_target_properties(cad3d_addon PROPERTIES
        PREFIX ""
        SUFFIX ".node"
        OUTPUT_NAME "cad3d_addon"
    )
    
    if(APPLE)
        set_target_properties(cad3d_addon PROPERTIES
            LINK_FLAGS "-undefined dynamic_lookup"
        )
    endif()
endif()

message(STATUS "===========================================")
message(STATUS "TSuperMachine Native Build Configuration")
message(STATUS "===========================================")
message(STATUS "Build Node Addon: ${BUILD_NODE_ADDON}")
message(STATUS "Build Tests: ${BUILD_TESTS}")
message(STATUS "===========================================")

# ============================================================================
# Calculation Engine Library (Core - Engineering Calculations)
# ============================================================================
add_library(calc_engine_core STATIC
    src/calc-engine/CalcEngine.cpp
)

target_include_directories(calc_engine_core PUBLIC
    ${CMAKE_SOURCE_DIR}/include/calc-engine
)

set_target_properties(calc_engine_core PROPERTIES POSITION_INDEPENDENT_CODE ON)

# ============================================================================
# Calculation Engine Node.js Addon
# ============================================================================
if(BUILD_NODE_ADDON)
    add_library(calc_engine SHARED
        src/calc-engine/CalcEngineBinding.cpp
    )
    
    target_include_directories(calc_engine PRIVATE
        ${CMAKE_SOURCE_DIR}/include
    )
    
    target_link_libraries(calc_engine PRIVATE
        calc_engine_core
        ${CMAKE_JS_LIB}
    )
    
    set_target_properties(calc_engine PROPERTIES
        PREFIX ""
        SUFFIX ".node"
        OUTPUT_NAME "calc_engine"
    )
    
    if(APPLE)
        set_target_properties(calc_engine PROPERTIES
            LINK_FLAGS "-undefined dynamic_lookup"
        )
    endif()
endif()
