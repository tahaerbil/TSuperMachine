/**
 * Engineering Calculation Engine - Implementation
 */

#include "../include/calc-engine/CalcEngine.hpp"
#include <algorithm>
#include <cmath>

namespace CalcEngine {

// ============================================
// STRENGTH OF MATERIALS - Implementation
// ============================================

double Strength::normalStress(double force, double area) {
    if (area <= 0) throw std::invalid_argument("Area must be positive");
    return force / area;
}

double Strength::shearStress(double shearForce, double area) {
    if (area <= 0) throw std::invalid_argument("Area must be positive");
    return shearForce / area;
}

double Strength::bendingStress(double moment, double y, double momentOfInertia) {
    if (momentOfInertia <= 0) throw std::invalid_argument("Moment of inertia must be positive");
    return (moment * y) / momentOfInertia;
}

double Strength::torsionalStress(double torque, double radius, double polarMoment) {
    if (polarMoment <= 0) throw std::invalid_argument("Polar moment must be positive");
    return (torque * radius) / polarMoment;
}

double Strength::vonMisesStress2D(double sigmaX, double sigmaY, double tauXY) {
    return std::sqrt(sigmaX * sigmaX - sigmaX * sigmaY + sigmaY * sigmaY + 3.0 * tauXY * tauXY);
}

double Strength::vonMisesStress3D(double s1, double s2, double s3) {
    return std::sqrt(0.5 * ((s1 - s2) * (s1 - s2) + (s2 - s3) * (s2 - s3) + (s3 - s1) * (s3 - s1)));
}

void Strength::principalStresses2D(double sigmaX, double sigmaY, double tauXY,
                                    double& sigma1, double& sigma2, double& tauMax) {
    double avg = (sigmaX + sigmaY) / 2.0;
    double R = std::sqrt(std::pow((sigmaX - sigmaY) / 2.0, 2) + tauXY * tauXY);
    
    sigma1 = avg + R;
    sigma2 = avg - R;
    tauMax = R;
}

StressResult Strength::analyzeCombinedStress(double axialForce, double shearForce,
                                              double bendingMoment, double torque,
                                              double area, double y, double I, double J, double r) {
    StressResult result;
    
    // Calculate individual stresses
    double sigmaNormal = normalStress(axialForce, area);
    double sigmaBending = bendingStress(bendingMoment, y, I);
    double tauShear = shearStress(shearForce, area);
    double tauTorsion = torsionalStress(torque, r, J);
    
    // Combine stresses
    result.normal = sigmaNormal + sigmaBending;
    result.shear = tauShear + tauTorsion;
    
    // Calculate Von Mises
    result.vonMises = vonMisesStress2D(result.normal, 0, result.shear);
    
    // Principal stresses
    double dummy;
    principalStresses2D(result.normal, 0, result.shear, result.principal1, result.principal2, dummy);
    result.principal3 = 0;  // 2D assumption
    
    return result;
}

// ============================================
// BEAM DEFLECTION - Implementation
// ============================================

DeflectionResult BeamDeflection::simplySupported_CenterLoad(double force, double length,
                                                             double E, double I) {
    DeflectionResult result;
    // δmax = F × L³ / (48 × E × I) at center
    result.maxDeflection = (force * std::pow(length, 3)) / (48.0 * E * I);
    result.slope = (force * length * length) / (16.0 * E * I);  // at support
    result.position = length / 2.0;
    return result;
}

DeflectionResult BeamDeflection::simplySupported_UniformLoad(double load, double length,
                                                              double E, double I) {
    DeflectionResult result;
    // δmax = 5 × w × L⁴ / (384 × E × I) at center
    result.maxDeflection = (5.0 * load * std::pow(length, 4)) / (384.0 * E * I);
    result.slope = (load * std::pow(length, 3)) / (24.0 * E * I);  // at support
    result.position = length / 2.0;
    return result;
}

DeflectionResult BeamDeflection::cantilever_EndLoad(double force, double length,
                                                     double E, double I) {
    DeflectionResult result;
    // δmax = F × L³ / (3 × E × I) at free end
    result.maxDeflection = (force * std::pow(length, 3)) / (3.0 * E * I);
    result.slope = (force * length * length) / (2.0 * E * I);  // at free end
    result.position = length;
    return result;
}

DeflectionResult BeamDeflection::cantilever_UniformLoad(double load, double length,
                                                         double E, double I) {
    DeflectionResult result;
    // δmax = w × L⁴ / (8 × E × I) at free end
    result.maxDeflection = (load * std::pow(length, 4)) / (8.0 * E * I);
    result.slope = (load * std::pow(length, 3)) / (6.0 * E * I);  // at free end
    result.position = length;
    return result;
}

DeflectionResult BeamDeflection::fixedFixed_CenterLoad(double force, double length,
                                                        double E, double I) {
    DeflectionResult result;
    // δmax = F × L³ / (192 × E × I) at center
    result.maxDeflection = (force * std::pow(length, 3)) / (192.0 * E * I);
    result.slope = 0;  // zero slope at center due to symmetry
    result.position = length / 2.0;
    return result;
}

// ============================================
// SHAFT DESIGN - Implementation
// ============================================

double ShaftDesign::diameterForTorsion(double torque, double allowableShear) {
    // τ = 16T / (π × d³) → d = ∛(16T / (π × τ))
    return std::cbrt((16.0 * torque) / (PI * allowableShear));
}

double ShaftDesign::diameterForBending(double moment, double allowableBending) {
    // σ = 32M / (π × d³) → d = ∛(32M / (π × σ))
    return std::cbrt((32.0 * moment) / (PI * allowableBending));
}

double ShaftDesign::diameterASME(double bendingMoment, double torque,
                                  double Kb, double Kt,
                                  double allowableShear) {
    // ASME code: d = ∛((16 / (π × τ)) × √((Kb×M)² + (Kt×T)²))
    double combined = std::sqrt(std::pow(Kb * bendingMoment, 2) + std::pow(Kt * torque, 2));
    return std::cbrt((16.0 / (PI * allowableShear)) * combined);
}

double ShaftDesign::criticalSpeed(double deflection) {
    // nc = (30/π) × √(g/δ)  [rpm]
    return (30.0 / PI) * std::sqrt(GRAVITY / deflection);
}

double ShaftDesign::powerTransmitted(double torque, double rpm) {
    // P = T × ω = T × 2πn/60
    return torque * 2.0 * PI * rpm / 60.0;
}

double ShaftDesign::torqueFromPower(double power, double rpm) {
    // T = P × 60 / (2πn)
    return (power * 60.0) / (2.0 * PI * rpm);
}

ShaftResult ShaftDesign::analyzeShaft(double power, double rpm,
                                       double length, double E,
                                       double allowableShear, double allowableBending) {
    ShaftResult result;
    
    // Calculate torque
    double torque = torqueFromPower(power, rpm);
    
    // Estimate bending moment (simplified - assume center supported with load)
    // This is a rough estimate; real analysis needs actual load distribution
    double estimatedLoad = power * 1000.0 / (rpm / 60.0 * length);  // Simplified
    double bendingMoment = estimatedLoad * length / 4.0;  // Simply supported, center
    
    // Calculate required diameter (ASME with Kb=1.5, Kt=1.0 for slight shock)
    result.diameter = diameterASME(bendingMoment, torque, 1.5, 1.0, allowableShear);
    
    // Calculate section properties
    double r = result.diameter / 2.0;
    double I = SectionProps::circleMomentOfInertia(r);
    double J = SectionProps::circlePolarMoment(r);
    
    // Calculate stresses
    result.torsionalStress = Strength::torsionalStress(torque, r, J);
    result.bendingStress = Strength::bendingStress(bendingMoment, r, I);
    
    // Calculate deflection (simplified - center load)
    result.deflection = (estimatedLoad * std::pow(length, 3)) / (48.0 * E * I);
    
    // Critical speed
    result.criticalSpeed = criticalSpeed(result.deflection);
    
    return result;
}

// ============================================
// BOLT CALCULATIONS - Implementation
// ============================================

double BoltCalc::stressArea(double nominalDiameter, double pitch) {
    // As = π/4 × (d - 0.9382 × P)²
    double d2 = nominalDiameter - 0.9382 * pitch;
    return (PI / 4.0) * d2 * d2;
}

double BoltCalc::preloadFromTorque(double torque, double K, double diameter) {
    // Fi = T / (K × d)
    return torque / (K * diameter);
}

double BoltCalc::tighteningTorque(double K, double diameter, double preload) {
    // T = K × d × Fi
    return K * diameter * preload;
}

double BoltCalc::tensileStress(double force, double stressAreaVal) {
    return force / stressAreaVal;
}

double BoltCalc::stiffnessRatio(double boltStiffness, double memberStiffness) {
    return boltStiffness / (boltStiffness + memberStiffness);
}

double BoltCalc::boltLoadWithExternal(double preload, double C, double externalForce) {
    return preload + C * externalForce;
}

BoltResult BoltCalc::analyzeBolt(double externalForce, double nominalDiameter,
                                  double pitch, double tighteningTorqueVal,
                                  double K, double proofStrength) {
    BoltResult result;
    
    // Calculate stress area
    double As = stressArea(nominalDiameter, pitch);
    
    // Calculate preload from tightening torque
    result.preload = preloadFromTorque(tighteningTorqueVal, K, nominalDiameter);
    
    // Estimate stiffness ratio (typical value for steel-on-steel)
    double C = 0.2;  // Typical for most joints
    
    // Calculate bolt load
    double boltLoad = boltLoadWithExternal(result.preload, C, externalForce);
    
    // Calculate tensile stress
    result.tensileStress = tensileStress(boltLoad, As);
    
    // Calculate safety factor
    result.safetyFactor = proofStrength / result.tensileStress;
    
    // Store tightening torque
    result.tighteningTorque = tighteningTorqueVal;
    
    return result;
}

// ============================================
// BEARING CALCULATIONS - Implementation
// ============================================

double BearingCalc::equivalentLoad(double radialLoad, double axialLoad,
                                    double X, double Y) {
    return X * radialLoad + Y * axialLoad;
}

double BearingCalc::lifeL10(double dynamicCapacity, double equivalentLoad, double exponent) {
    // L10 = (C/P)^p  [million revolutions]
    return std::pow(dynamicCapacity / equivalentLoad, exponent);
}

double BearingCalc::lifeHours(double L10, double rpm) {
    // Lh = L10 × 10^6 / (60 × n)  [hours]
    return (L10 * 1e6) / (60.0 * rpm);
}

double BearingCalc::requiredCapacity(double load, double hours, double rpm, double exponent) {
    // C = P × (Lh × 60 × n / 10^6)^(1/p)
    return load * std::pow((hours * 60.0 * rpm) / 1e6, 1.0 / exponent);
}

BearingResult BearingCalc::analyzeBearing(double radialLoad, double axialLoad,
                                           double rpm, double dynamicCapacity,
                                           double X, double Y, double exponent) {
    BearingResult result;
    
    // Calculate equivalent load
    double P = equivalentLoad(radialLoad, axialLoad, X, Y);
    
    result.dynamicLoad = P;
    result.life_L10 = lifeL10(dynamicCapacity, P, exponent);
    result.life_hours = lifeHours(result.life_L10, rpm);
    
    return result;
}

// ============================================
// GEAR CALCULATIONS - Implementation
// ============================================

double GearCalc::pitchDiameter(double module, int teeth) {
    return module * teeth;
}

double GearCalc::centerDistance(double d1, double d2) {
    return (d1 + d2) / 2.0;
}

double GearCalc::gearRatio(int z1, int z2) {
    return static_cast<double>(z2) / z1;
}

double GearCalc::transmittedPower(double torque, double rpm) {
    return torque * 2.0 * PI * rpm / 60.0;
}

double GearCalc::tangentialForce(double power, double pitchDiam, double rpm) {
    // Ft = 2 × P / (d × ω) = 60000 × P / (π × d × n)
    return (60000.0 * power) / (PI * pitchDiam * rpm);
}

double GearCalc::lewisBendingStress(double tangentialForce, double module,
                                     double faceWidth, double formFactor) {
    // σ = Ft / (b × m × Y)
    return tangentialForce / (faceWidth * module * formFactor);
}

double GearCalc::hertzContactStress(double tangentialForce, double faceWidth,
                                     double d1, double d2, double E, double nu) {
    // Simplified Hertz formula
    // σH = 0.564 × √(Ft × E / (b × ρ)) where ρ = d1×d2 / (2×(d1+d2))
    double rho = (d1 * d2) / (2.0 * (d1 + d2));
    return 0.564 * std::sqrt((tangentialForce * E) / (faceWidth * rho));
}

GearResult GearCalc::analyzeGear(double power, double rpm1,
                                  double module, int z1, int z2,
                                  double faceWidth, double E, double allowableStress) {
    GearResult result;
    
    // Calculate pitch diameters
    double d1 = pitchDiameter(module, z1);
    double d2 = pitchDiameter(module, z2);
    result.pitchDiameter = d1;
    
    // Calculate tangential force
    double Ft = tangentialForce(power, d1, rpm1);
    
    // Calculate stresses (using typical form factor Y = 0.3)
    result.bendingStress = lewisBendingStress(Ft, module, faceWidth, 0.3);
    result.contactStress = hertzContactStress(Ft, faceWidth, d1, d2, E, 0.3);
    
    // Safety factor
    result.safetyFactor = allowableStress / std::max(result.bendingStress, result.contactStress);
    
    return result;
}

// ============================================
// FATIGUE ANALYSIS - Implementation
// ============================================

double FatigueCalc::modifiedEnduranceLimit(double Se_prime,
                                            double ka, double kb, double kc,
                                            double kd, double ke) {
    return ka * kb * kc * kd * ke * Se_prime;
}

double FatigueCalc::surfaceFactor(double Sut, double a, double b) {
    // ka = a × Sut^b (Sut in MPa)
    return a * std::pow(Sut, b);
}

double FatigueCalc::sizeFactor(double diameter) {
    // kb for rotating shaft (diameter in mm)
    double d_mm = diameter * 1000.0;  // Convert to mm if in meters
    
    if (d_mm <= 8.0) {
        return 1.0;
    } else if (d_mm <= 51.0) {
        return std::pow(d_mm / 7.62, -0.107);
    } else if (d_mm <= 254.0) {
        return 0.879 * std::pow(d_mm, -0.107);
    } else {
        return 0.6;  // Conservative for large shafts
    }
}

double FatigueCalc::goodmanSafetyFactor(double sigmaA, double sigmaM,
                                         double Se, double Sut) {
    // 1/n = σa/Se + σm/Sut
    return 1.0 / (sigmaA / Se + sigmaM / Sut);
}

double FatigueCalc::gerberSafetyFactor(double sigmaA, double sigmaM,
                                        double Se, double Sut) {
    // 1/n = σa/Se + (σm/Sut)²
    return 1.0 / (sigmaA / Se + std::pow(sigmaM / Sut, 2));
}

double FatigueCalc::soderbergSafetyFactor(double sigmaA, double sigmaM,
                                           double Se, double Sy) {
    // 1/n = σa/Se + σm/Sy
    return 1.0 / (sigmaA / Se + sigmaM / Sy);
}

FatigueResult FatigueCalc::analyzeFatigue(double sigmaMax, double sigmaMin,
                                           double Sut, double diameter,
                                           const std::string& surfaceFinish) {
    FatigueResult result;
    
    // Calculate alternating and mean stresses
    double sigmaA = (sigmaMax - sigmaMin) / 2.0;
    double sigmaM = (sigmaMax + sigmaMin) / 2.0;
    
    // Estimate Se' (endurance limit for steel)
    double Se_prime = (Sut < 1400e6) ? 0.5 * Sut : 700e6;
    
    // Surface finish factors (a, b coefficients)
    double a, b;
    if (surfaceFinish == "ground") {
        a = 1.58; b = -0.085;
    } else if (surfaceFinish == "machined") {
        a = 4.51; b = -0.265;
    } else if (surfaceFinish == "hot-rolled") {
        a = 57.7; b = -0.718;
    } else {  // forged or as-cast
        a = 272.0; b = -0.995;
    }
    
    // Calculate factors
    double ka = surfaceFactor(Sut / 1e6, a, b);  // Sut in MPa
    double kb = sizeFactor(diameter);
    double kc = 1.0;  // Bending
    double kd = 1.0;  // Room temperature
    double ke = 1.0;  // 50% reliability
    
    // Modified endurance limit
    result.enduranceLimit = modifiedEnduranceLimit(Se_prime, ka, kb, kc, kd, ke);
    result.fatigueStrength = result.enduranceLimit;
    
    // Safety factor (Goodman criterion)
    result.safetyFactor = goodmanSafetyFactor(sigmaA, sigmaM, result.enduranceLimit, Sut);
    
    // Estimate cycles (infinite life if n > 1)
    result.cycles = (result.safetyFactor >= 1.0) ? 1e7 : 1e5;  // Simplified
    
    return result;
}

// ============================================
// SPRING CALCULATIONS - Implementation
// ============================================

double SpringCalc::springRate(double G, double wireDiameter,
                               double meanDiameter, double activeCoils) {
    // k = G × d^4 / (8 × D^3 × Na)
    return (G * std::pow(wireDiameter, 4)) / (8.0 * std::pow(meanDiameter, 3) * activeCoils);
}

double SpringCalc::wahlFactor(double springIndex) {
    // K = (4C - 1) / (4C - 4) + 0.615/C
    double C = springIndex;
    return (4.0 * C - 1.0) / (4.0 * C - 4.0) + 0.615 / C;
}

double SpringCalc::shearStress(double force, double wireDiameter,
                                double meanDiameter, double wahl_K) {
    // τ = K × (8 × F × D) / (π × d^3)
    return wahl_K * (8.0 * force * meanDiameter) / (PI * std::pow(wireDiameter, 3));
}

double SpringCalc::deflection(double force, double rate) {
    return force / rate;
}

double SpringCalc::naturalFrequency(double rate, double mass) {
    // fn = (1/2π) × √(k/m)  [Hz]
    return (1.0 / (2.0 * PI)) * std::sqrt(rate / mass);
}

// ============================================
// WELDING CALCULATIONS - Implementation
// ============================================

double WeldCalc::filletThroatArea(double legSize, double length) {
    // A = 0.707 × a × L
    return 0.707 * legSize * length;
}

double WeldCalc::weldShearStress(double force, double throatArea) {
    return force / throatArea;
}

double WeldCalc::combinedWeldStress(double shearStress, double normalStress) {
    return std::sqrt(shearStress * shearStress + normalStress * normalStress);
}

double WeldCalc::allowableWeldStress(double electrodeStrength) {
    // Typically 0.3 × Sut for fillet welds
    return 0.3 * electrodeStrength;
}

// ============================================
// SECTION PROPERTIES - Implementation
// ============================================

double SectionProps::circleArea(double radius) {
    return PI * radius * radius;
}

double SectionProps::circleMomentOfInertia(double radius) {
    // I = π × r^4 / 4
    return (PI * std::pow(radius, 4)) / 4.0;
}

double SectionProps::circlePolarMoment(double radius) {
    // J = π × r^4 / 2
    return (PI * std::pow(radius, 4)) / 2.0;
}

double SectionProps::pipeArea(double outerRadius, double innerRadius) {
    return PI * (outerRadius * outerRadius - innerRadius * innerRadius);
}

double SectionProps::pipeMomentOfInertia(double outerRadius, double innerRadius) {
    return (PI / 4.0) * (std::pow(outerRadius, 4) - std::pow(innerRadius, 4));
}

double SectionProps::pipePolarMoment(double outerRadius, double innerRadius) {
    return (PI / 2.0) * (std::pow(outerRadius, 4) - std::pow(innerRadius, 4));
}

double SectionProps::rectangleArea(double width, double height) {
    return width * height;
}

double SectionProps::rectangleMomentOfInertia(double width, double height) {
    // I = b × h^3 / 12
    return (width * std::pow(height, 3)) / 12.0;
}

double SectionProps::iBeamMomentOfInertia(double flangeWidth, double webHeight,
                                           double flangeThickness, double webThickness) {
    // Simplified: I = (B×H³ - b×h³) / 12
    double B = flangeWidth;
    double H = webHeight + 2.0 * flangeThickness;
    double b = flangeWidth - webThickness;
    double h = webHeight;
    
    return (B * std::pow(H, 3) - b * std::pow(h, 3)) / 12.0;
}

} // namespace CalcEngine
