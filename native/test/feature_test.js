const path = require('path');
const addonPath = path.resolve(__dirname, '../build/Release/cad3d_addon.node');
const cad3d = require(addonPath);

console.log('Loading CAD3D Addon from:', addonPath);

try {
    // 1. Initialize Engine
    cad3d.createEngine();
    console.log('✅ Engine initialized');

    // 2. Create Datum Plane
    const planeId = cad3d.createDatumPlane(0, 0, 0, 0, 0, 1);
    console.log('✅ Datum Plane created, ID:', planeId);

    // 3. Create Sketch on that plane
    const sketchId = cad3d.createSketch(planeId);
    console.log('✅ Sketch created, ID:', sketchId);

    // 4. Add Line and Circle to Sketch
    // Rectangle 10x10
    cad3d.addSketchLine(sketchId, 0, 0, 10, 0);
    cad3d.addSketchLine(sketchId, 10, 0, 10, 10);
    cad3d.addSketchLine(sketchId, 10, 10, 0, 10);
    cad3d.addSketchLine(sketchId, 0, 10, 0, 0);
    console.log('✅ Sketch elements added');

    // 5. Extrude
    const extrudeId = cad3d.createExtrude(sketchId, 50);
    console.log('✅ Extrude operation result ID:', extrudeId);

    if (extrudeId > 0) {
        console.log('🎉 SUCCESS: Feature-based modeling core works!');
    } else {
        console.error('❌ FAILURE: Extrude returned ID 0');
    }

    // 6. Cleanup
    cad3d.destroyEngine();

} catch (e) {
    console.error('❌ Test Failed:', e);
}
