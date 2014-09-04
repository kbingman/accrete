/**
 * These are all of the global variables used during accretion:
 */

var anum;
var stellar_luminosity_ratio;
var mainSeqLife;
var age, r_ecosphere;
var r_greenhouse;
// var randomTool;

function System(seed){
    seed = seed || 100;
    randomTool = new MersenneTwister(seed);
}

System.prototype = Object.create({

    distributePlanets: function(stellarMass) {
        var astro = new Astro();
        var accrete = new Accrete();

        var planet = {};
        var planets = [];

        this.stellarMassRatio = stellarMass || utils.randomNumber(0.6, 1.3);
        stellar_luminosity_ratio = astro.luminosity(this.stellarMassRatio);

        planet = accrete.distributePlanetaryMasses(this.stellarMassRatio, stellar_luminosity_ratio, 0.0, accrete.stellarDustLimit(this.stellarMassRatio));

        mainSeqLife = 1.0E10 * (this.stellarMassRatio / stellar_luminosity_ratio);

        if ((mainSeqLife >= 6.0E9)) {
            age = utils.randomNumber(1.0E9, 6.0E9);
        }
        else {
            age = utils.randomNumber(1.0E9, mainSeqLife);
        }

        r_ecosphere = Math.sqrt(stellar_luminosity_ratio);
        var r_greenhouse = r_ecosphere * GREENHOUSE_EFFECT_CONST;

        while (planet !== NULL) {
            planet.orbit_zone = astro.orbitalZone(planet.a);

            if (planet.gasGiant) {
                planet.density = astro.empiricalDensity(planet.mass, planet.a, planet.gasGiant);
                planet.radius = astro.volumeRadius(planet.mass, planet.density);
            } else {
                planet.radius = astro.kothariRadius(planet.mass, planet.a, planet.gasGiant, planet.orbit_zone);
                planet.density = astro.volumeDensity(planet.mass, planet.radius);
            }
            planet.orbital_period = astro.period(planet.a, planet.mass, this.stellarMassRatio);
            planet.day = astro.dayLength(planet.mass, planet.radius, planet.orbital_period, planet.e, planet.gasGiant);
            planet.resonant_period = spin_resonance;
            planet.axial_tilt = astro.inclination(planet.a);
            planet.escape_velocity = astro.escapeVel(planet.mass, planet.radius);
            planet.surface_accel = astro.acceleration(planet.mass, planet.radius);
            planet.rms_velocity = astro.rmsVel(MOLECULAR_NITROGEN, planet.a);
            planet.molecule_weight = astro.moleculeLimit(planet.a, planet.mass, planet.radius);

            if ((planet.gasGiant)) {
                planet.surface_grav = INCREDIBLY_LARGE_NUMBER;
                planet.greenhouse_effect = FALSE;
                planet.volatile_gas_inventory = INCREDIBLY_LARGE_NUMBER;
                planet.surface_pressure = INCREDIBLY_LARGE_NUMBER;
                planet.boil_point = INCREDIBLY_LARGE_NUMBER;
                planet.hydrosphere = INCREDIBLY_LARGE_NUMBER;
                planet.albedo = utils.about(GAS_GIANT_ALBEDO, 0.1);
                planet.surface_temp = INCREDIBLY_LARGE_NUMBER;
            } else {
                planet.surface_grav = astro.gravity(planet.surface_accel);
                planet.greenhouse_effect = astro.greenhouse(planet.orbit_zone, planet.a, r_greenhouse);
                planet.volatile_gas_inventory = astro.volInventory(planet.mass, planet.escape_velocity, planet.rms_velocity, this.stellarMassRatio, planet.orbit_zone, planet.greenhouse_effect);
                planet.surface_pressure = astro.pressure(planet.volatile_gas_inventory, planet.radius, planet.surface_grav);
                if ((planet.surface_pressure === 0)) {
                    planet.boil_point = 0;
                }
                else {
                    planet.boil_point = astro.boilingPoint(planet.surface_pressure);
                }

                astro.iterateSurfaceTemp(planet);
            }

            planets.push(planet);
            planet = planet.next_planet;

        }

        return this.systemToJSON(planets);
    },

    systemToJSON: function(planets) {

        var jsonOut = {
            'star' : {
                'mass' : this.stellarMassRatio,
                'luminosity' : stellar_luminosity_ratio,
                'mainSequenceLifetime' : (mainSeqLife / 1.0E6),
                'currentAge' : (age / 1.0E6),
                'ecospherRadius' : r_ecosphere
            },
            'planets' : []
        };

        jsonOut.planets = planets.map(function(planet, counter) {
            return {
                'number' : counter + 1,
                'gasGiant' : planet.gasGiant,
                'resonantPeriod' : planet.resonant_period,
                'distanceFromPrimaryStar' : planet.a,
                'eccentricity' : planet.e,
                'mass' : planet.mass * EARTH_MASSES_PER_SOLAR_MASS,
                'equatorialRadius' : planet.radius,
                'density' : planet.density,
                'escapeVelocity' : planet.escape_velocity / CM_PER_KM,
                'smallestMolecularWeight' : getSmallestMolecularWeight(planet.molecule_weight),
                'surfaceAcceleration' : planet.surface_accel,
                'surfaceGravity' : planet.surface_grav,
                'boilingPointOfWater' : (planet.boil_point - KELVIN_CELCIUS_DIFFERENCE),
                'surfacePressure' : (planet.surface_pressure / 1000.0),
                'greenhouseEffect' : planet.greenhouse_effect,
                'surfaceTemperature' : (planet.surface_temp - KELVIN_CELCIUS_DIFFERENCE),
                'hydrospherePercentage' : (planet.hydrosphere * 100),
                'cloudCoverPercentage' : (planet.cloud_cover * 100),
                'iceCoverPercentage' : (planet.ice_cover * 100),
                'axialTilt' : planet.axial_tilt,
                'albedo' : planet.albedo,
                'lengthOfYear' : (planet.orbital_period / 365.25),
                'lengthOfDay' : planet.day,

            };
        });

        return jsonOut;
    }
});
