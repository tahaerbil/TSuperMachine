"""
Thermodynamic Properties Calculator using CoolProp
Provides access to fluid properties for engineering calculations.

CoolProp delivers thermophysical property data for 122+ pure and pseudo-pure fluids,
plus 40+ incompressible fluids, plus mixture properties.
"""

import json
import sys
from typing import Optional, Dict, Any, List

try:
    import CoolProp.CoolProp as CP
    from CoolProp.CoolProp import PropsSI, HAPropsSI
    COOLPROP_AVAILABLE = True
except ImportError:
    COOLPROP_AVAILABLE = False
    print("Warning: CoolProp not installed. Thermodynamic calculations unavailable.", file=sys.stderr)


# Common fluids with Turkish names
FLUID_DATABASE = {
    # Water and Steam
    "water": {"name": "Su", "nameEN": "Water", "coolprop": "Water"},
    "steam": {"name": "Buhar", "nameEN": "Steam", "coolprop": "Water"},
    
    # Refrigerants
    "r134a": {"name": "R134a", "nameEN": "R134a", "coolprop": "R134a"},
    "r410a": {"name": "R410A", "nameEN": "R410A", "coolprop": "R410A"},
    "r22": {"name": "R22", "nameEN": "R22", "coolprop": "R22"},
    "r404a": {"name": "R404A", "nameEN": "R404A", "coolprop": "R404A"},
    "r407c": {"name": "R407C", "nameEN": "R407C", "coolprop": "R407C"},
    "r32": {"name": "R32", "nameEN": "R32", "coolprop": "R32"},
    "r1234yf": {"name": "R1234yf", "nameEN": "R1234yf", "coolprop": "R1234yf"},
    "ammonia": {"name": "Amonyak", "nameEN": "Ammonia", "coolprop": "Ammonia"},
    "co2": {"name": "Karbondioksit", "nameEN": "Carbon Dioxide", "coolprop": "CO2"},
    
    # Gases
    "air": {"name": "Hava", "nameEN": "Air", "coolprop": "Air"},
    "nitrogen": {"name": "Azot", "nameEN": "Nitrogen", "coolprop": "Nitrogen"},
    "oxygen": {"name": "Oksijen", "nameEN": "Oxygen", "coolprop": "Oxygen"},
    "hydrogen": {"name": "Hidrojen", "nameEN": "Hydrogen", "coolprop": "Hydrogen"},
    "helium": {"name": "Helyum", "nameEN": "Helium", "coolprop": "Helium"},
    "argon": {"name": "Argon", "nameEN": "Argon", "coolprop": "Argon"},
    "methane": {"name": "Metan", "nameEN": "Methane", "coolprop": "Methane"},
    "propane": {"name": "Propan", "nameEN": "Propane", "coolprop": "Propane"},
    "butane": {"name": "Bütan", "nameEN": "Butane", "coolprop": "Butane"},
    
    # Oils and others
    "ethanol": {"name": "Etanol", "nameEN": "Ethanol", "coolprop": "Ethanol"},
    "methanol": {"name": "Metanol", "nameEN": "Methanol", "coolprop": "Methanol"},
}


def get_fluid_list() -> List[Dict[str, str]]:
    """Get list of available fluids."""
    return [
        {"id": k, "name": v["name"], "nameEN": v["nameEN"]}
        for k, v in FLUID_DATABASE.items()
    ]


def get_coolprop_name(fluid_id: str) -> Optional[str]:
    """Convert fluid ID to CoolProp name."""
    if fluid_id in FLUID_DATABASE:
        return FLUID_DATABASE[fluid_id]["coolprop"]
    # Try direct CoolProp name
    return fluid_id


def get_properties_at_pt(
    fluid: str,
    pressure: float,  # Pa
    temperature: float  # K
) -> Dict[str, Any]:
    """
    Get fluid properties at given pressure and temperature.
    
    Args:
        fluid: Fluid ID or CoolProp name
        pressure: Pressure in Pa
        temperature: Temperature in K
    
    Returns:
        Dictionary with thermodynamic properties
    """
    if not COOLPROP_AVAILABLE:
        return {"error": "CoolProp not available"}
    
    cp_fluid = get_coolprop_name(fluid)
    if not cp_fluid:
        return {"error": f"Unknown fluid: {fluid}"}
    
    try:
        result = {
            "fluid": fluid,
            "pressure": pressure,  # Pa
            "temperature": temperature,  # K
            
            # Density
            "density": PropsSI("D", "P", pressure, "T", temperature, cp_fluid),  # kg/m³
            
            # Specific volumes
            "specificVolume": 1 / PropsSI("D", "P", pressure, "T", temperature, cp_fluid),  # m³/kg
            
            # Enthalpy and entropy
            "enthalpy": PropsSI("H", "P", pressure, "T", temperature, cp_fluid),  # J/kg
            "entropy": PropsSI("S", "P", pressure, "T", temperature, cp_fluid),  # J/(kg·K)
            
            # Internal energy
            "internalEnergy": PropsSI("U", "P", pressure, "T", temperature, cp_fluid),  # J/kg
            
            # Heat capacities
            "cp": PropsSI("C", "P", pressure, "T", temperature, cp_fluid),  # J/(kg·K)
            "cv": PropsSI("O", "P", pressure, "T", temperature, cp_fluid),  # J/(kg·K)
            
            # Transport properties
            "viscosity": PropsSI("V", "P", pressure, "T", temperature, cp_fluid),  # Pa·s
            "thermalConductivity": PropsSI("L", "P", pressure, "T", temperature, cp_fluid),  # W/(m·K)
            
            # Speed of sound
            "speedOfSound": PropsSI("A", "P", pressure, "T", temperature, cp_fluid),  # m/s
            
            # Phase
            "phase": CP.PhaseSI("P", pressure, "T", temperature, cp_fluid),
            
            # Quality (for two-phase)
            "quality": None  # Will be set if in two-phase region
        }
        
        # Try to get quality if in two-phase region
        try:
            if result["phase"] == "twophase":
                result["quality"] = PropsSI("Q", "P", pressure, "T", temperature, cp_fluid)
        except:
            pass
        
        return result
    
    except Exception as e:
        return {"error": str(e)}


def get_saturation_properties(
    fluid: str,
    temperature: Optional[float] = None,  # K
    pressure: Optional[float] = None  # Pa
) -> Dict[str, Any]:
    """
    Get saturation properties at given temperature or pressure.
    
    Args:
        fluid: Fluid ID or CoolProp name
        temperature: Saturation temperature in K (optional)
        pressure: Saturation pressure in Pa (optional)
    
    Returns:
        Dictionary with saturation properties
    """
    if not COOLPROP_AVAILABLE:
        return {"error": "CoolProp not available"}
    
    cp_fluid = get_coolprop_name(fluid)
    if not cp_fluid:
        return {"error": f"Unknown fluid: {fluid}"}
    
    try:
        if temperature is not None:
            # Get properties at saturation temperature
            p_sat = PropsSI("P", "T", temperature, "Q", 0, cp_fluid)
            t_sat = temperature
        elif pressure is not None:
            # Get properties at saturation pressure
            t_sat = PropsSI("T", "P", pressure, "Q", 0, cp_fluid)
            p_sat = pressure
        else:
            return {"error": "Either temperature or pressure must be provided"}
        
        result = {
            "fluid": fluid,
            "saturationTemperature": t_sat,  # K
            "saturationPressure": p_sat,  # Pa
            
            # Saturated liquid properties (Q=0)
            "liquid": {
                "density": PropsSI("D", "P", p_sat, "Q", 0, cp_fluid),
                "enthalpy": PropsSI("H", "P", p_sat, "Q", 0, cp_fluid),
                "entropy": PropsSI("S", "P", p_sat, "Q", 0, cp_fluid),
                "cp": PropsSI("C", "P", p_sat, "Q", 0, cp_fluid),
                "viscosity": PropsSI("V", "P", p_sat, "Q", 0, cp_fluid),
                "thermalConductivity": PropsSI("L", "P", p_sat, "Q", 0, cp_fluid),
            },
            
            # Saturated vapor properties (Q=1)
            "vapor": {
                "density": PropsSI("D", "P", p_sat, "Q", 1, cp_fluid),
                "enthalpy": PropsSI("H", "P", p_sat, "Q", 1, cp_fluid),
                "entropy": PropsSI("S", "P", p_sat, "Q", 1, cp_fluid),
                "cp": PropsSI("C", "P", p_sat, "Q", 1, cp_fluid),
                "viscosity": PropsSI("V", "P", p_sat, "Q", 1, cp_fluid),
                "thermalConductivity": PropsSI("L", "P", p_sat, "Q", 1, cp_fluid),
            },
            
            # Latent heat of vaporization
            "latentHeat": (
                PropsSI("H", "P", p_sat, "Q", 1, cp_fluid) -
                PropsSI("H", "P", p_sat, "Q", 0, cp_fluid)
            ),
        }
        
        return result
    
    except Exception as e:
        return {"error": str(e)}


def get_critical_point(fluid: str) -> Dict[str, Any]:
    """Get critical point properties of a fluid."""
    if not COOLPROP_AVAILABLE:
        return {"error": "CoolProp not available"}
    
    cp_fluid = get_coolprop_name(fluid)
    if not cp_fluid:
        return {"error": f"Unknown fluid: {fluid}"}
    
    try:
        return {
            "fluid": fluid,
            "criticalTemperature": PropsSI("Tcrit", cp_fluid),  # K
            "criticalPressure": PropsSI("Pcrit", cp_fluid),  # Pa
            "criticalDensity": PropsSI("rhocrit", cp_fluid),  # kg/m³
        }
    except Exception as e:
        return {"error": str(e)}


def get_triple_point(fluid: str) -> Dict[str, Any]:
    """Get triple point properties of a fluid."""
    if not COOLPROP_AVAILABLE:
        return {"error": "CoolProp not available"}
    
    cp_fluid = get_coolprop_name(fluid)
    if not cp_fluid:
        return {"error": f"Unknown fluid: {fluid}"}
    
    try:
        return {
            "fluid": fluid,
            "tripleTemperature": PropsSI("Ttriple", cp_fluid),  # K
            "triplePressure": PropsSI("ptriple", cp_fluid),  # Pa
        }
    except Exception as e:
        return {"error": str(e)}


def calculate_compression_work(
    fluid: str,
    p1: float,  # Pa
    t1: float,  # K
    p2: float,  # Pa
    efficiency: float = 1.0  # Isentropic efficiency
) -> Dict[str, Any]:
    """
    Calculate isentropic compression work.
    
    Args:
        fluid: Fluid ID
        p1: Inlet pressure (Pa)
        t1: Inlet temperature (K)
        p2: Outlet pressure (Pa)
        efficiency: Isentropic efficiency (0-1)
    
    Returns:
        Compression work and outlet conditions
    """
    if not COOLPROP_AVAILABLE:
        return {"error": "CoolProp not available"}
    
    cp_fluid = get_coolprop_name(fluid)
    if not cp_fluid:
        return {"error": f"Unknown fluid: {fluid}"}
    
    try:
        # Inlet state
        h1 = PropsSI("H", "P", p1, "T", t1, cp_fluid)
        s1 = PropsSI("S", "P", p1, "T", t1, cp_fluid)
        
        # Isentropic outlet (s2s = s1)
        h2s = PropsSI("H", "P", p2, "S", s1, cp_fluid)
        t2s = PropsSI("T", "P", p2, "S", s1, cp_fluid)
        
        # Actual outlet with efficiency
        w_isentropic = h2s - h1
        w_actual = w_isentropic / efficiency
        h2_actual = h1 + w_actual
        t2_actual = PropsSI("T", "P", p2, "H", h2_actual, cp_fluid)
        
        return {
            "fluid": fluid,
            "inlet": {
                "pressure": p1,
                "temperature": t1,
                "enthalpy": h1,
                "entropy": s1,
            },
            "outletIsentropic": {
                "pressure": p2,
                "temperature": t2s,
                "enthalpy": h2s,
            },
            "outletActual": {
                "pressure": p2,
                "temperature": t2_actual,
                "enthalpy": h2_actual,
            },
            "isentropicWork": w_isentropic,  # J/kg
            "actualWork": w_actual,  # J/kg
            "efficiency": efficiency,
        }
    
    except Exception as e:
        return {"error": str(e)}


def calculate_expansion_work(
    fluid: str,
    p1: float,  # Pa
    t1: float,  # K
    p2: float,  # Pa
    efficiency: float = 1.0  # Isentropic efficiency
) -> Dict[str, Any]:
    """
    Calculate isentropic expansion (turbine) work.
    
    Args:
        fluid: Fluid ID
        p1: Inlet pressure (Pa)
        t1: Inlet temperature (K)
        p2: Outlet pressure (Pa)
        efficiency: Isentropic efficiency (0-1)
    
    Returns:
        Expansion work and outlet conditions
    """
    if not COOLPROP_AVAILABLE:
        return {"error": "CoolProp not available"}
    
    cp_fluid = get_coolprop_name(fluid)
    if not cp_fluid:
        return {"error": f"Unknown fluid: {fluid}"}
    
    try:
        # Inlet state
        h1 = PropsSI("H", "P", p1, "T", t1, cp_fluid)
        s1 = PropsSI("S", "P", p1, "T", t1, cp_fluid)
        
        # Isentropic outlet (s2s = s1)
        h2s = PropsSI("H", "P", p2, "S", s1, cp_fluid)
        t2s = PropsSI("T", "P", p2, "S", s1, cp_fluid)
        
        # Actual outlet with efficiency
        w_isentropic = h1 - h2s
        w_actual = w_isentropic * efficiency
        h2_actual = h1 - w_actual
        t2_actual = PropsSI("T", "P", p2, "H", h2_actual, cp_fluid)
        
        return {
            "fluid": fluid,
            "inlet": {
                "pressure": p1,
                "temperature": t1,
                "enthalpy": h1,
                "entropy": s1,
            },
            "outletIsentropic": {
                "pressure": p2,
                "temperature": t2s,
                "enthalpy": h2s,
            },
            "outletActual": {
                "pressure": p2,
                "temperature": t2_actual,
                "enthalpy": h2_actual,
            },
            "isentropicWork": w_isentropic,  # J/kg
            "actualWork": w_actual,  # J/kg
            "efficiency": efficiency,
        }
    
    except Exception as e:
        return {"error": str(e)}


def calculate_humid_air_properties(
    dry_bulb_temp: float,  # K
    relative_humidity: float,  # 0-1
    pressure: float = 101325  # Pa
) -> Dict[str, Any]:
    """
    Calculate humid air properties using CoolProp's HAPropsSI.
    
    Args:
        dry_bulb_temp: Dry bulb temperature (K)
        relative_humidity: Relative humidity (0-1)
        pressure: Atmospheric pressure (Pa)
    
    Returns:
        Humid air properties
    """
    if not COOLPROP_AVAILABLE:
        return {"error": "CoolProp not available"}
    
    try:
        # Convert K to C for some calculations
        t_c = dry_bulb_temp - 273.15
        
        result = {
            "dryBulbTemperature": dry_bulb_temp,  # K
            "relativeHumidity": relative_humidity,  # -
            "pressure": pressure,  # Pa
            
            # Humidity ratio (kg water / kg dry air)
            "humidityRatio": HAPropsSI("W", "T", dry_bulb_temp, "R", relative_humidity, "P", pressure),
            
            # Wet bulb temperature
            "wetBulbTemperature": HAPropsSI("Twb", "T", dry_bulb_temp, "R", relative_humidity, "P", pressure),
            
            # Dew point temperature
            "dewPointTemperature": HAPropsSI("Tdp", "T", dry_bulb_temp, "R", relative_humidity, "P", pressure),
            
            # Enthalpy
            "enthalpy": HAPropsSI("H", "T", dry_bulb_temp, "R", relative_humidity, "P", pressure),  # J/kg dry air
            
            # Specific volume
            "specificVolume": HAPropsSI("V", "T", dry_bulb_temp, "R", relative_humidity, "P", pressure),  # m³/kg dry air
            
            # Density
            "density": 1 / HAPropsSI("V", "T", dry_bulb_temp, "R", relative_humidity, "P", pressure),
        }
        
        return result
    
    except Exception as e:
        return {"error": str(e)}


# Main IPC handler
def main():
    """Main function for IPC communication with Node.js."""
    for line in sys.stdin:
        try:
            request = json.loads(line.strip())
            action = request.get("action")
            params = request.get("params", {})
            
            if action == "ping":
                result = {"status": "ok", "coolprop_available": COOLPROP_AVAILABLE}
            
            elif action == "get_fluids":
                result = get_fluid_list()
            
            elif action == "get_properties_pt":
                result = get_properties_at_pt(
                    params["fluid"],
                    params["pressure"],
                    params["temperature"]
                )
            
            elif action == "get_saturation":
                result = get_saturation_properties(
                    params["fluid"],
                    params.get("temperature"),
                    params.get("pressure")
                )
            
            elif action == "get_critical":
                result = get_critical_point(params["fluid"])
            
            elif action == "get_triple":
                result = get_triple_point(params["fluid"])
            
            elif action == "compression_work":
                result = calculate_compression_work(
                    params["fluid"],
                    params["p1"],
                    params["t1"],
                    params["p2"],
                    params.get("efficiency", 1.0)
                )
            
            elif action == "expansion_work":
                result = calculate_expansion_work(
                    params["fluid"],
                    params["p1"],
                    params["t1"],
                    params["p2"],
                    params.get("efficiency", 1.0)
                )
            
            elif action == "humid_air":
                result = calculate_humid_air_properties(
                    params["temperature"],
                    params["relativeHumidity"],
                    params.get("pressure", 101325)
                )
            
            else:
                result = {"error": f"Unknown action: {action}"}
            
            print(json.dumps(result), flush=True)
        
        except json.JSONDecodeError as e:
            print(json.dumps({"error": f"Invalid JSON: {e}"}), flush=True)
        except Exception as e:
            print(json.dumps({"error": str(e)}), flush=True)


if __name__ == "__main__":
    main()
