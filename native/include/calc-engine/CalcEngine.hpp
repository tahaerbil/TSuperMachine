/**
 * Engineering Calculation Engine
 * Professional Mechanical Engineering Calculations
 * 
 * Uses Eigen for linear algebra operations
 */

#ifndef CALC_ENGINE_HPP
#define CALC_ENGINE_HPP

#include <vector>
#include <string>
#include <cmath>
#include <stdexcept>

namespace CalcEngine {

// ============================================
// CONSTANTS
// ============================================

constexpr double PI = 3.14159265358979323846;
constexpr double GRAVITY = 9.80665;  // m/s²
constexpr double STEFAN_BOLTZMANN = 5.670374419e-8;  // W/(m²·K⁴)

// ============================================
// STRUCTURES
// ============================================

struct StressResult {
    double normal;      // Normal stress (Pa)
    double shear;       // Shear stress (Pa)
    double vonMises;    // Von Mises equivalent stress (Pa)
    double principal1;  // Principal stress 1 (Pa)
    double principal2;  // Principal stress 2 (Pa)
    double principal3;  // Principal stress 3 (Pa)
};

struct DeflectionResult {
    double maxDeflection;  // Maximum deflection (m)
    double slope;          // Slope at point (rad)
    double position;       // Position of max deflection (m)
};

struct ShaftResult {
    double diameter;       // Required diameter (m)
    double criticalSpeed;  // Critical speed (rpm)
    double deflection;     // Maximum deflection (m)
    double torsionalStress; // Torsional stress (Pa)
    double bendingStress;  // Bending stress (Pa)
};

struct BoltResult {
    double preload;        // Preload force (N)
    double tensileStress;  // Tensile stress (Pa)
    double safetyFactor;   // Safety factor
    double tighteningTorque; // Tightening torque (N·m)
};

struct BearingResult {
    double dynamicLoad;    // Dynamic load rating (N)
    double life_L10;       // L10 life (million revolutions)
    double life_hours;     // Life in hours
};

struct GearResult {
    double pitchDiameter;  // Pitch diameter (m)
    double contactStress;  // Contact stress (Pa)
    double bendingStress;  // Bending stress (Pa)
    double safetyFactor;   // Safety factor
};

struct FatigueResult {
    double fatigueStrength; // Fatigue strength (Pa)
    double enduranceLimit;  // Endurance limit (Pa)
    double cycles;          // Expected life cycles
    double safetyFactor;    // Fatigue safety factor
};

// ============================================
// STRENGTH OF MATERIALS
// ============================================

class Strength {
public:
    // Normal stress: σ = F / A
    static double normalStress(double force, double area);
    
    // Shear stress: τ = V / A
    static double shearStress(double shearForce, double area);
    
    // Bending stress: σ = M × y / I
    static double bendingStress(double moment, double y, double momentOfInertia);
    
    // Torsional stress: τ = T × r / J
    static double torsionalStress(double torque, double radius, double polarMoment);
    
    // Von Mises stress (2D): σvm = √(σx² - σx×σy + σy² + 3×τxy²)
    static double vonMisesStress2D(double sigmaX, double sigmaY, double tauXY);
    
    // Von Mises stress (3D)
    static double vonMisesStress3D(double s1, double s2, double s3);
    
    // Principal stresses from stress tensor (2D)
    static void principalStresses2D(double sigmaX, double sigmaY, double tauXY,
                                    double& sigma1, double& sigma2, double& tauMax);
    
    // Combined stress analysis
    static StressResult analyzeCombinedStress(double axialForce, double shearForce,
                                               double bendingMoment, double torque,
                                               double area, double y, double I, double J, double r);
};

// ============================================
// BEAM DEFLECTION
// ============================================

class BeamDeflection {
public:
    // Simply supported beam with center load
    static DeflectionResult simplySupported_CenterLoad(double force, double length,
                                                        double E, double I);
    
    // Simply supported beam with uniform load
    static DeflectionResult simplySupported_UniformLoad(double load, double length,
                                                         double E, double I);
    
    // Cantilever with end load
    static DeflectionResult cantilever_EndLoad(double force, double length,
                                                double E, double I);
    
    // Cantilever with uniform load
    static DeflectionResult cantilever_UniformLoad(double load, double length,
                                                    double E, double I);
    
    // Fixed-fixed beam with center load
    static DeflectionResult fixedFixed_CenterLoad(double force, double length,
                                                   double E, double I);
};

// ============================================
// SHAFT DESIGN
// ============================================

class ShaftDesign {
public:
    // Calculate required diameter for pure torsion
    static double diameterForTorsion(double torque, double allowableShear);
    
    // Calculate required diameter for pure bending
    static double diameterForBending(double moment, double allowableBending);
    
    // Calculate required diameter for combined loading (ASME method)
    static double diameterASME(double bendingMoment, double torque,
                               double Kb, double Kt,
                               double allowableShear);
    
    // Critical speed calculation (Rayleigh method - single mass)
    static double criticalSpeed(double deflection);
    
    // Power transmitted by shaft: P = T × ω
    static double powerTransmitted(double torque, double rpm);
    
    // Torque from power: T = P / ω
    static double torqueFromPower(double power, double rpm);
    
    // Full shaft analysis
    static ShaftResult analyzeShaft(double power, double rpm,
                                     double length, double E,
                                     double allowableShear, double allowableBending);
};

// ============================================
// BOLT/FASTENER CALCULATIONS
// ============================================

class BoltCalc {
public:
    // Tensile stress area (metric thread)
    static double stressArea(double nominalDiameter, double pitch);
    
    // Preload from tightening torque: Fi = T / (K × d)
    static double preloadFromTorque(double torque, double K, double diameter);
    
    // Tightening torque: T = K × d × Fi
    static double tighteningTorque(double K, double diameter, double preload);
    
    // Bolt tensile stress
    static double tensileStress(double force, double stressArea);
    
    // Joint stiffness ratio: C = kb / (kb + km)
    static double stiffnessRatio(double boltStiffness, double memberStiffness);
    
    // Bolt load with external force: Fb = Fi + C × Fe
    static double boltLoadWithExternal(double preload, double C, double externalForce);
    
    // Full bolt analysis
    static BoltResult analyzeBolt(double externalForce, double nominalDiameter,
                                   double pitch, double tighteningTorqueVal,
                                   double K, double proofStrength);
};

// ============================================
// BEARING CALCULATIONS
// ============================================

class BearingCalc {
public:
    // Equivalent dynamic load: P = X × Fr + Y × Fa
    static double equivalentLoad(double radialLoad, double axialLoad,
                                  double X, double Y);
    
    // L10 life (million revolutions): L10 = (C/P)^p
    static double lifeL10(double dynamicCapacity, double equivalentLoad, double exponent);
    
    // Life in hours: Lh = L10 × 10^6 / (60 × n)
    static double lifeHours(double L10, double rpm);
    
    // Required dynamic capacity: C = P × (Lh × 60 × n / 10^6)^(1/p)
    static double requiredCapacity(double load, double hours, double rpm, double exponent);
    
    // Full bearing analysis
    static BearingResult analyzeBearing(double radialLoad, double axialLoad,
                                         double rpm, double dynamicCapacity,
                                         double X, double Y, double exponent);
};

// ============================================
// GEAR CALCULATIONS
// ============================================

class GearCalc {
public:
    // Pitch diameter: d = m × z (metric)
    static double pitchDiameter(double module, int teeth);
    
    // Center distance: a = (d1 + d2) / 2
    static double centerDistance(double d1, double d2);
    
    // Gear ratio: i = z2 / z1 = n1 / n2
    static double gearRatio(int z1, int z2);
    
    // Transmitted power: P = T × ω
    static double transmittedPower(double torque, double rpm);
    
    // Tangential force: Ft = 2000 × P / (d × n)
    static double tangentialForce(double power, double pitchDiameter, double rpm);
    
    // Lewis bending stress (simplified)
    static double lewisBendingStress(double tangentialForce, double module,
                                      double faceWidth, double formFactor);
    
    // Hertz contact stress (simplified)
    static double hertzContactStress(double tangentialForce, double faceWidth,
                                      double d1, double d2, double E, double nu);
    
    // Full gear analysis
    static GearResult analyzeGear(double power, double rpm1,
                                   double module, int z1, int z2,
                                   double faceWidth, double E, double allowableStress);
};

// ============================================
// FATIGUE ANALYSIS
// ============================================

class FatigueCalc {
public:
    // Modified endurance limit: Se = ka × kb × kc × kd × ke × Se'
    static double modifiedEnduranceLimit(double Se_prime,
                                          double ka, double kb, double kc,
                                          double kd, double ke);
    
    // Surface factor ka (for machined steel): ka = a × Sut^b
    static double surfaceFactor(double Sut, double a, double b);
    
    // Size factor kb (for rotating shaft)
    static double sizeFactor(double diameter);
    
    // Goodman criterion safety factor
    static double goodmanSafetyFactor(double sigmaA, double sigmaM,
                                       double Se, double Sut);
    
    // Gerber criterion safety factor
    static double gerberSafetyFactor(double sigmaA, double sigmaM,
                                      double Se, double Sut);
    
    // Soderberg criterion safety factor
    static double soderbergSafetyFactor(double sigmaA, double sigmaM,
                                         double Se, double Sy);
    
    // Full fatigue analysis
    static FatigueResult analyzeFatigue(double sigmaMax, double sigmaMin,
                                         double Sut, double diameter,
                                         const std::string& surfaceFinish);
};

// ============================================
// SPRING CALCULATIONS
// ============================================

class SpringCalc {
public:
    // Compression/extension spring rate: k = G × d^4 / (8 × D^3 × Na)
    static double springRate(double G, double wireDiameter,
                              double meanDiameter, double activeCoils);
    
    // Shear stress in spring: τ = K × (8 × F × D) / (π × d^3)
    static double shearStress(double force, double wireDiameter,
                               double meanDiameter, double wahl_K);
    
    // Wahl correction factor
    static double wahlFactor(double springIndex);
    
    // Spring deflection: δ = F / k
    static double deflection(double force, double springRate);
    
    // Natural frequency of spring
    static double naturalFrequency(double springRate, double mass);
};

// ============================================
// WELDING CALCULATIONS
// ============================================

class WeldCalc {
public:
    // Fillet weld throat area: A = 0.707 × a × L
    static double filletThroatArea(double legSize, double length);
    
    // Weld shear stress
    static double weldShearStress(double force, double throatArea);
    
    // Combined weld stress (shear + bending)
    static double combinedWeldStress(double shearStress, double normalStress);
    
    // Allowable weld stress (typically 0.3 × Sut of electrode)
    static double allowableWeldStress(double electrodeStrength);
};

// ============================================
// SECTION PROPERTIES
// ============================================

class SectionProps {
public:
    // Solid circle
    static double circleArea(double radius);
    static double circleMomentOfInertia(double radius);
    static double circlePolarMoment(double radius);
    
    // Hollow circle (pipe/tube)
    static double pipeArea(double outerRadius, double innerRadius);
    static double pipeMomentOfInertia(double outerRadius, double innerRadius);
    static double pipePolarMoment(double outerRadius, double innerRadius);
    
    // Rectangle
    static double rectangleArea(double width, double height);
    static double rectangleMomentOfInertia(double width, double height);
    
    // I-beam (simplified)
    static double iBeamMomentOfInertia(double flangeWidth, double webHeight,
                                        double flangeThickness, double webThickness);
};

} // namespace CalcEngine

#endif // CALC_ENGINE_HPP
