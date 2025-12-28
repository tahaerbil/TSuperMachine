/**
 * Node.js N-API Binding for Calculation Engine
 * Exposes C++ calculation functions to JavaScript
 */

#include <napi.h>
#include "../include/calc-engine/CalcEngine.hpp"

using namespace Napi;
using namespace CalcEngine;

// ============================================
// STRENGTH MODULE
// ============================================

Value NormalStress(const CallbackInfo& info) {
    Env env = info.Env();
    
    if (info.Length() < 2) {
        TypeError::New(env, "Expected 2 arguments: force, area").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    double force = info[0].As<Number>().DoubleValue();
    double area = info[1].As<Number>().DoubleValue();
    
    try {
        double result = Strength::normalStress(force, area);
        return Number::New(env, result);
    } catch (const std::exception& e) {
        Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Value BendingStress(const CallbackInfo& info) {
    Env env = info.Env();
    
    if (info.Length() < 3) {
        TypeError::New(env, "Expected 3 arguments: moment, y, I").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    double moment = info[0].As<Number>().DoubleValue();
    double y = info[1].As<Number>().DoubleValue();
    double I = info[2].As<Number>().DoubleValue();
    
    try {
        double result = Strength::bendingStress(moment, y, I);
        return Number::New(env, result);
    } catch (const std::exception& e) {
        Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Value TorsionalStress(const CallbackInfo& info) {
    Env env = info.Env();
    
    if (info.Length() < 3) {
        TypeError::New(env, "Expected 3 arguments: torque, radius, J").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    double torque = info[0].As<Number>().DoubleValue();
    double radius = info[1].As<Number>().DoubleValue();
    double J = info[2].As<Number>().DoubleValue();
    
    try {
        double result = Strength::torsionalStress(torque, radius, J);
        return Number::New(env, result);
    } catch (const std::exception& e) {
        Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Value VonMisesStress2D(const CallbackInfo& info) {
    Env env = info.Env();
    
    if (info.Length() < 3) {
        TypeError::New(env, "Expected 3 arguments: sigmaX, sigmaY, tauXY").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    double sigmaX = info[0].As<Number>().DoubleValue();
    double sigmaY = info[1].As<Number>().DoubleValue();
    double tauXY = info[2].As<Number>().DoubleValue();
    
    double result = Strength::vonMisesStress2D(sigmaX, sigmaY, tauXY);
    return Number::New(env, result);
}

Value AnalyzeCombinedStress(const CallbackInfo& info) {
    Env env = info.Env();
    
    if (info.Length() < 9) {
        TypeError::New(env, "Expected 9 arguments").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    double axialForce = info[0].As<Number>().DoubleValue();
    double shearForce = info[1].As<Number>().DoubleValue();
    double bendingMoment = info[2].As<Number>().DoubleValue();
    double torque = info[3].As<Number>().DoubleValue();
    double area = info[4].As<Number>().DoubleValue();
    double y = info[5].As<Number>().DoubleValue();
    double I = info[6].As<Number>().DoubleValue();
    double J = info[7].As<Number>().DoubleValue();
    double r = info[8].As<Number>().DoubleValue();
    
    try {
        StressResult res = Strength::analyzeCombinedStress(
            axialForce, shearForce, bendingMoment, torque, area, y, I, J, r);
        
        Object result = Object::New(env);
        result.Set("normal", Number::New(env, res.normal));
        result.Set("shear", Number::New(env, res.shear));
        result.Set("vonMises", Number::New(env, res.vonMises));
        result.Set("principal1", Number::New(env, res.principal1));
        result.Set("principal2", Number::New(env, res.principal2));
        result.Set("principal3", Number::New(env, res.principal3));
        return result;
    } catch (const std::exception& e) {
        Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

// ============================================
// BEAM DEFLECTION MODULE
// ============================================

Value BeamDeflection_SimplySupportedCenter(const CallbackInfo& info) {
    Env env = info.Env();
    
    if (info.Length() < 4) {
        TypeError::New(env, "Expected 4 arguments: force, length, E, I").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    double force = info[0].As<Number>().DoubleValue();
    double length = info[1].As<Number>().DoubleValue();
    double E = info[2].As<Number>().DoubleValue();
    double I = info[3].As<Number>().DoubleValue();
    
    DeflectionResult res = BeamDeflection::simplySupported_CenterLoad(force, length, E, I);
    
    Object result = Object::New(env);
    result.Set("maxDeflection", Number::New(env, res.maxDeflection));
    result.Set("slope", Number::New(env, res.slope));
    result.Set("position", Number::New(env, res.position));
    return result;
}

Value BeamDeflection_CantileverEnd(const CallbackInfo& info) {
    Env env = info.Env();
    
    if (info.Length() < 4) {
        TypeError::New(env, "Expected 4 arguments: force, length, E, I").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    double force = info[0].As<Number>().DoubleValue();
    double length = info[1].As<Number>().DoubleValue();
    double E = info[2].As<Number>().DoubleValue();
    double I = info[3].As<Number>().DoubleValue();
    
    DeflectionResult res = BeamDeflection::cantilever_EndLoad(force, length, E, I);
    
    Object result = Object::New(env);
    result.Set("maxDeflection", Number::New(env, res.maxDeflection));
    result.Set("slope", Number::New(env, res.slope));
    result.Set("position", Number::New(env, res.position));
    return result;
}

// ============================================
// SHAFT DESIGN MODULE
// ============================================

Value ShaftDiameterForTorsion(const CallbackInfo& info) {
    Env env = info.Env();
    
    if (info.Length() < 2) {
        TypeError::New(env, "Expected 2 arguments: torque, allowableShear").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    double torque = info[0].As<Number>().DoubleValue();
    double allowableShear = info[1].As<Number>().DoubleValue();
    
    double result = ShaftDesign::diameterForTorsion(torque, allowableShear);
    return Number::New(env, result);
}

Value ShaftPower(const CallbackInfo& info) {
    Env env = info.Env();
    
    if (info.Length() < 2) {
        TypeError::New(env, "Expected 2 arguments: torque, rpm").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    double torque = info[0].As<Number>().DoubleValue();
    double rpm = info[1].As<Number>().DoubleValue();
    
    double result = ShaftDesign::powerTransmitted(torque, rpm);
    return Number::New(env, result);
}

Value ShaftTorqueFromPower(const CallbackInfo& info) {
    Env env = info.Env();
    
    if (info.Length() < 2) {
        TypeError::New(env, "Expected 2 arguments: power, rpm").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    double power = info[0].As<Number>().DoubleValue();
    double rpm = info[1].As<Number>().DoubleValue();
    
    double result = ShaftDesign::torqueFromPower(power, rpm);
    return Number::New(env, result);
}

Value AnalyzeShaft(const CallbackInfo& info) {
    Env env = info.Env();
    
    if (info.Length() < 6) {
        TypeError::New(env, "Expected 6 arguments").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    double power = info[0].As<Number>().DoubleValue();
    double rpm = info[1].As<Number>().DoubleValue();
    double length = info[2].As<Number>().DoubleValue();
    double E = info[3].As<Number>().DoubleValue();
    double allowableShear = info[4].As<Number>().DoubleValue();
    double allowableBending = info[5].As<Number>().DoubleValue();
    
    ShaftResult res = ShaftDesign::analyzeShaft(power, rpm, length, E, allowableShear, allowableBending);
    
    Object result = Object::New(env);
    result.Set("diameter", Number::New(env, res.diameter));
    result.Set("criticalSpeed", Number::New(env, res.criticalSpeed));
    result.Set("deflection", Number::New(env, res.deflection));
    result.Set("torsionalStress", Number::New(env, res.torsionalStress));
    result.Set("bendingStress", Number::New(env, res.bendingStress));
    return result;
}

// ============================================
// BOLT CALCULATIONS MODULE
// ============================================

Value BoltStressArea(const CallbackInfo& info) {
    Env env = info.Env();
    
    if (info.Length() < 2) {
        TypeError::New(env, "Expected 2 arguments: diameter, pitch").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    double diameter = info[0].As<Number>().DoubleValue();
    double pitch = info[1].As<Number>().DoubleValue();
    
    double result = BoltCalc::stressArea(diameter, pitch);
    return Number::New(env, result);
}

Value AnalyzeBolt(const CallbackInfo& info) {
    Env env = info.Env();
    
    if (info.Length() < 6) {
        TypeError::New(env, "Expected 6 arguments").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    double externalForce = info[0].As<Number>().DoubleValue();
    double diameter = info[1].As<Number>().DoubleValue();
    double pitch = info[2].As<Number>().DoubleValue();
    double torque = info[3].As<Number>().DoubleValue();
    double K = info[4].As<Number>().DoubleValue();
    double proofStrength = info[5].As<Number>().DoubleValue();
    
    BoltResult res = BoltCalc::analyzeBolt(externalForce, diameter, pitch, torque, K, proofStrength);
    
    Object result = Object::New(env);
    result.Set("preload", Number::New(env, res.preload));
    result.Set("tensileStress", Number::New(env, res.tensileStress));
    result.Set("safetyFactor", Number::New(env, res.safetyFactor));
    result.Set("tighteningTorque", Number::New(env, res.tighteningTorque));
    return result;
}

// ============================================
// BEARING CALCULATIONS MODULE
// ============================================

Value AnalyzeBearing(const CallbackInfo& info) {
    Env env = info.Env();
    
    if (info.Length() < 7) {
        TypeError::New(env, "Expected 7 arguments").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    double radialLoad = info[0].As<Number>().DoubleValue();
    double axialLoad = info[1].As<Number>().DoubleValue();
    double rpm = info[2].As<Number>().DoubleValue();
    double dynamicCapacity = info[3].As<Number>().DoubleValue();
    double X = info[4].As<Number>().DoubleValue();
    double Y = info[5].As<Number>().DoubleValue();
    double exponent = info[6].As<Number>().DoubleValue();
    
    BearingResult res = BearingCalc::analyzeBearing(radialLoad, axialLoad, rpm, 
                                                     dynamicCapacity, X, Y, exponent);
    
    Object result = Object::New(env);
    result.Set("dynamicLoad", Number::New(env, res.dynamicLoad));
    result.Set("lifeL10", Number::New(env, res.life_L10));
    result.Set("lifeHours", Number::New(env, res.life_hours));
    return result;
}

// ============================================
// GEAR CALCULATIONS MODULE
// ============================================

Value AnalyzeGear(const CallbackInfo& info) {
    Env env = info.Env();
    
    if (info.Length() < 8) {
        TypeError::New(env, "Expected 8 arguments").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    double power = info[0].As<Number>().DoubleValue();
    double rpm = info[1].As<Number>().DoubleValue();
    double module = info[2].As<Number>().DoubleValue();
    int z1 = info[3].As<Number>().Int32Value();
    int z2 = info[4].As<Number>().Int32Value();
    double faceWidth = info[5].As<Number>().DoubleValue();
    double E = info[6].As<Number>().DoubleValue();
    double allowableStress = info[7].As<Number>().DoubleValue();
    
    GearResult res = GearCalc::analyzeGear(power, rpm, module, z1, z2, faceWidth, E, allowableStress);
    
    Object result = Object::New(env);
    result.Set("pitchDiameter", Number::New(env, res.pitchDiameter));
    result.Set("contactStress", Number::New(env, res.contactStress));
    result.Set("bendingStress", Number::New(env, res.bendingStress));
    result.Set("safetyFactor", Number::New(env, res.safetyFactor));
    return result;
}

// ============================================
// FATIGUE ANALYSIS MODULE
// ============================================

Value AnalyzeFatigue(const CallbackInfo& info) {
    Env env = info.Env();
    
    if (info.Length() < 5) {
        TypeError::New(env, "Expected 5 arguments").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    double sigmaMax = info[0].As<Number>().DoubleValue();
    double sigmaMin = info[1].As<Number>().DoubleValue();
    double Sut = info[2].As<Number>().DoubleValue();
    double diameter = info[3].As<Number>().DoubleValue();
    std::string surface = info[4].As<String>().Utf8Value();
    
    FatigueResult res = FatigueCalc::analyzeFatigue(sigmaMax, sigmaMin, Sut, diameter, surface);
    
    Object result = Object::New(env);
    result.Set("fatigueStrength", Number::New(env, res.fatigueStrength));
    result.Set("enduranceLimit", Number::New(env, res.enduranceLimit));
    result.Set("cycles", Number::New(env, res.cycles));
    result.Set("safetyFactor", Number::New(env, res.safetyFactor));
    return result;
}

// ============================================
// SPRING CALCULATIONS MODULE
// ============================================

Value SpringRate(const CallbackInfo& info) {
    Env env = info.Env();
    
    if (info.Length() < 4) {
        TypeError::New(env, "Expected 4 arguments: G, d, D, Na").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    double G = info[0].As<Number>().DoubleValue();
    double wireDia = info[1].As<Number>().DoubleValue();
    double meanDia = info[2].As<Number>().DoubleValue();
    double activeCoils = info[3].As<Number>().DoubleValue();
    
    double result = SpringCalc::springRate(G, wireDia, meanDia, activeCoils);
    return Number::New(env, result);
}

// ============================================
// SECTION PROPERTIES MODULE
// ============================================

Value CircleArea(const CallbackInfo& info) {
    Env env = info.Env();
    double radius = info[0].As<Number>().DoubleValue();
    return Number::New(env, SectionProps::circleArea(radius));
}

Value CircleMomentOfInertia(const CallbackInfo& info) {
    Env env = info.Env();
    double radius = info[0].As<Number>().DoubleValue();
    return Number::New(env, SectionProps::circleMomentOfInertia(radius));
}

Value CirclePolarMoment(const CallbackInfo& info) {
    Env env = info.Env();
    double radius = info[0].As<Number>().DoubleValue();
    return Number::New(env, SectionProps::circlePolarMoment(radius));
}

// ============================================
// MODULE INITIALIZATION
// ============================================

Object Init(Env env, Object exports) {
    // Strength
    exports.Set("normalStress", Function::New(env, NormalStress));
    exports.Set("bendingStress", Function::New(env, BendingStress));
    exports.Set("torsionalStress", Function::New(env, TorsionalStress));
    exports.Set("vonMisesStress2D", Function::New(env, VonMisesStress2D));
    exports.Set("analyzeCombinedStress", Function::New(env, AnalyzeCombinedStress));
    
    // Beam Deflection
    exports.Set("beamDeflection_simplySupportedCenter", Function::New(env, BeamDeflection_SimplySupportedCenter));
    exports.Set("beamDeflection_cantileverEnd", Function::New(env, BeamDeflection_CantileverEnd));
    
    // Shaft
    exports.Set("shaftDiameterForTorsion", Function::New(env, ShaftDiameterForTorsion));
    exports.Set("shaftPower", Function::New(env, ShaftPower));
    exports.Set("shaftTorqueFromPower", Function::New(env, ShaftTorqueFromPower));
    exports.Set("analyzeShaft", Function::New(env, AnalyzeShaft));
    
    // Bolt
    exports.Set("boltStressArea", Function::New(env, BoltStressArea));
    exports.Set("analyzeBolt", Function::New(env, AnalyzeBolt));
    
    // Bearing
    exports.Set("analyzeBearing", Function::New(env, AnalyzeBearing));
    
    // Gear
    exports.Set("analyzeGear", Function::New(env, AnalyzeGear));
    
    // Fatigue
    exports.Set("analyzeFatigue", Function::New(env, AnalyzeFatigue));
    
    // Spring
    exports.Set("springRate", Function::New(env, SpringRate));
    
    // Section Properties
    exports.Set("circleArea", Function::New(env, CircleArea));
    exports.Set("circleMomentOfInertia", Function::New(env, CircleMomentOfInertia));
    exports.Set("circlePolarMoment", Function::New(env, CirclePolarMoment));
    
    return exports;
}

NODE_API_MODULE(calc_engine, Init)
