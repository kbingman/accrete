/*----------------------------------------------------------------------*/
/*                           BIBLIOGRAPHY
/*  Dole, Stephen H.  'Formation of Planetary Systems by Aggregation:
/*      a Computer Simulation'  October 1969,  Rand Corporation Paper
/*  P-4226.
/*----------------------------------------------------------------------*/

/* Variables global to the accretion process */
var dust_left;
var r_inner;
var r_outer;
var reduced_mass;
var dust_density;
var cloud_eccentricity;
var dust_head;

// requirements
var utils = new Utils();

function Accrete(){}

Accrete.prototype = Object.create({

    setInitialConditions: function(inner_limit_of_dust, outer_limit_of_dust) {
        dust_head = new dust_bands_record();
        planet_head = NULL;
        dust_head.next_band = NULL;
        dust_head.outer_edge = outer_limit_of_dust;
        dust_head.inner_edge = inner_limit_of_dust;
        dust_head.dust_present = true;
        dust_head.gas_present = true;
        dust_left = true;
        cloud_eccentricity = 0.2;
    },

    distributePlanetaryMasses: function(stellar_mass_ratio, stellar_luminosity_ratio, inner_dust, outer_dust) {
        var a, e, crit_mass, planetesimal_inner_bound, planetesimal_outer_bound;
        var mass;

        this.setInitialConditions(inner_dust, outer_dust);
        planetesimal_inner_bound = this.innermostPlanet(stellar_mass_ratio);
        planetesimal_outer_bound = this.outermostPlanet(stellar_mass_ratio);

        while (dust_left) {
            a = utils.randomNumber(planetesimal_inner_bound, planetesimal_outer_bound);
            e = utils.randomEccentricity();
            mass = new MASS(PROTOPLANET_MASS);
            if (VERBOSE) {
                console.debug('Checking' + a + 'AU');
            }
            if (this.dustAvailable(this.innerEffectLimit(a, e, mass.VALUE), this.outerEffectLimit(a, e, mass.VALUE))) {
                console.debug('.. Injecting protoplanet.');

                dust_density = DUST_DENSITY_COEFF * Math.sqrt(stellar_mass_ratio) * Math.exp(-ALPHA * Math.pow(a, (1.0 / N)));
                crit_mass = this.criticalLimit(a, e, stellar_luminosity_ratio);
                this.accreteDust(mass, a, e, crit_mass, planetesimal_inner_bound, planetesimal_outer_bound);
                if ((mass.VALUE !== 0.0) && (mass.VALUE != PROTOPLANET_MASS)) {
                    this.coalescePlanetesimals(a, e, mass.VALUE, crit_mass, stellar_luminosity_ratio, planetesimal_inner_bound, planetesimal_outer_bound);
                } else {
                    console.debug('.. failed due to large neighbor.');
                }
            } else {
                if (VERBOSE) {
                    console.debug('.. failed.');
                }
            }
        }
        return planet_head;
    },

    dustAvailable: function(inside_range, outside_range) {
        var current_dust_band;
        var dust_here;

        current_dust_band = dust_head;
        while (current_dust_band != NULL && current_dust_band.outer_edge < inside_range) {
            current_dust_band = current_dust_band.next_band;
        }

        if (current_dust_band == NULL) {
            dust_here = false;
        }
        else {
            dust_here = current_dust_band.dust_present;
        }

        while ((current_dust_band != NULL) && (current_dust_band.inner_edge < outside_range)) {
            dust_here = dust_here || current_dust_band.dust_present;
            current_dust_band = current_dust_band.next_band;
        }
        return (dust_here);
    },

    updateDustLanes: function(min, max, mass, crit_mass, body_inner_bound, body_outer_bound) {
        var gas;
        var node1 = new dust_bands_record(),
            node2 = new dust_bands_record(),
            node3 = new dust_bands_record();

        dust_left = false;
        if ((mass > crit_mass)) {
            gas = false;
        } else {
            gas = true;
        }
        node1 = dust_head;
        while (node1 != NULL) {
            if (node1.inner_edge < min && node1.outer_edge > max) {
                node2 = new dust_bands_record();
                node2.inner_edge = min;
                node2.outer_edge = max;
                if ((node1.gas_present === true)) {
                node2.gas_present = gas;
                } else {
                node2.gas_present = false;
                }
                node2.dust_present = false;
                node3 = new dust_bands_record();
                node3.inner_edge = max;
                node3.outer_edge = node1.outer_edge;
                node3.gas_present = node1.gas_present;
                node3.dust_present = node1.dust_present;
                node3.next_band = node1.next_band;
                node1.next_band = node2;
                node2.next_band = node3;
                node1.outer_edge = min;
                node1 = node3.next_band;
            } else if (((node1.inner_edge < max) && (node1.outer_edge > max))) {
                node2 = new dust_bands_record();
                node2.next_band = node1.next_band;
                node2.dust_present = node1.dust_present;
                node2.gas_present = node1.gas_present;
                node2.outer_edge = node1.outer_edge;
                node2.inner_edge = max;
                node1.next_band = node2;
                node1.outer_edge = max;
                if ((node1.gas_present === true))
                node1.gas_present = gas;
                else
                node1.gas_present = false;
                node1.dust_present = false;
                node1 = node2.next_band;
            } else if (((node1.inner_edge < min) && (node1.outer_edge > min))) {
                node2 = new dust_bands_record();
                node2.next_band = node1.next_band;
                node2.dust_present = false;
                if ((node1.gas_present === true))
                node2.gas_present = gas;
                else
                node2.gas_present = false;
                node2.outer_edge = node1.outer_edge;
                node2.inner_edge = min;
                node1.next_band = node2;
                node1.outer_edge = min;
                node1 = node2.next_band;
            } else if (((node1.inner_edge >= min) && (node1.outer_edge <= max))) {
                if (node1.gas_present === true) {
                    node1.gas_present = gas;
                }
                node1.dust_present = false;
                node1 = node1.next_band;
            } else if (((node1.outer_edge < min) || (node1.inner_edge > max))) {
                node1 = node1.next_band;
            }
        }
        node1 = dust_head;
        while ((node1 !== NULL)) {
            if (node1.dust_present && node1.outer_edge >= body_inner_bound && node1.inner_edge <= body_outer_bound) {
                dust_left = true;
            }

            node2 = node1.next_band;
            if (node2 != NULL) {
                if (node1.dust_present == node2.dust_present && node1.gas_present == node2.gas_present) {
                    node1.outer_edge = node2.outer_edge;
                    node1.next_band = node2.next_band;
                    // free(node2);
                }
            }
            node1 = node1.next_band;
        }
    },

    collectDust: function(last_mass, a, e, crit_mass, dust_band) {
        var mass_density, temp1, temp2, temp, temp_density, bandwidth, width, volume;

        temp = last_mass / (1.0 + last_mass);
        reduced_mass = Math.pow(temp, (1.0 / 4.0));
        r_inner = this.innerEffectLimit(a, e, reduced_mass);
        r_outer = this.outerEffectLimit(a, e, reduced_mass);

        if (r_inner < 0.0) {
            r_inner = 0.0;
        }
        if (dust_band == NULL) {
            return (0.0);
        }

        else {
            if ((dust_band.dust_present === false))
                temp_density = 0.0;
            else
                temp_density = dust_density;
            if (last_mass < crit_mass || dust_band.gas_present === false)
                mass_density = temp_density;
            else
                mass_density = K * temp_density / (1.0 + Math.sqrt(crit_mass / last_mass) * (K - 1.0));
            if (((dust_band.outer_edge <= r_inner) || (dust_band.inner_edge >= r_outer)))
                return (this.collectDust(last_mass, a, e, crit_mass, dust_band.next_band));
            else {
                bandwidth = (r_outer - r_inner);
                temp1 = r_outer - dust_band.outer_edge;
                if (temp1 < 0.0) {
                    temp1 = 0.0;
                }

                width = bandwidth - temp1;
                temp2 = dust_band.inner_edge - r_inner;
                if (temp2 < 0.0) {
                    temp2 = 0.0;
                }

                width = width - temp2;
                temp = 4.0 * PI * Math.pow(a, 2.0) * reduced_mass * (1.0 - e * (temp1 - temp2) / bandwidth);
                volume = temp * width;

                return (volume * mass_density + this.collectDust(last_mass, a, e, crit_mass, dust_band.next_band));
            }
        }
    },

    accreteDust: function(seed_mass, a, e, crit_mass, body_inner_bound, body_outer_bound) {
        var new_mass, temp_mass;

        new_mass = seed_mass.VALUE;
        do {
            temp_mass = new_mass;
            new_mass = this.collectDust(new_mass, a, e, crit_mass, dust_head);
        } while (new_mass - temp_mass > 0.0001 * temp_mass);
        seed_mass.VALUE = seed_mass.VALUE + new_mass;
        this.updateDustLanes(r_inner, r_outer, seed_mass.VALUE, crit_mass, body_inner_bound, body_outer_bound);
    },

    coalescePlanetesimals: function(a, e, mass, crit_mass, stellar_luminosity_ratio, body_inner_bound, body_outer_bound) {
        var node1, node2, node3;
        var coalesced;
        var dist1, dist2, a3;

        var temp;

        coalesced = false;
        node1 = planet_head;
        node2 = NULL;
        node3 = NULL;
        while ((node1 != NULL)) {
        node2 = node1;
        temp = new MASS(node1.a - a);
        if ((temp.VALUE > 0.0)) {
            dist1 = (a * (1.0 + e) * (1.0 + reduced_mass)) - a;
            /* x aphelion */
            reduced_mass = Math.pow((node1.mass / (1.0 + node1.mass)), (1.0 / 4.0));
            dist2 = node1.a - (node1.a * (1.0 - node1.e) * (1.0 - reduced_mass));
        } else {
            dist1 = a - (a * (1.0 - e) * (1.0 - reduced_mass));
            /* x perihelion */
            reduced_mass = Math.pow(node1.mass / (1.0 + node1.mass), (1.0 / 4.0));
            dist2 = (node1.a * (1.0 + node1.e) * (1.0 + reduced_mass)) - node1.a;
        }
        if (Math.abs(temp.VALUE) <= Math.abs(dist1) || Math.abs(temp.VALUE) <= Math.abs(dist2)) {
            console.debug('Collision between two planetesimals!');

            a3 = (node1.mass + mass) / ((node1.mass / node1.a) + (mass / a));
            temp = new MASS(node1.mass * Math.sqrt(node1.a) * Math.sqrt(1.0 - Math.pow(node1.e, 2.0)));
            temp.VALUE = temp.VALUE + (mass * Math.sqrt(a) * Math.sqrt(Math.sqrt(1.0 - Math.pow(e, 2.0))));
            temp.VALUE = temp.VALUE / ((node1.mass + mass) * Math.sqrt(a3));
            temp.VALUE = 1.0 - Math.pow(temp.VALUE, 2.0);
            if (((temp.VALUE < 0.0) || (temp.VALUE >= 1.0)))
            temp.VALUE = 0.0;
            e = Math.sqrt(temp.VALUE);
            temp.VALUE = node1.mass + mass;
            this.accreteDust(temp, a3, e, stellar_luminosity_ratio, body_inner_bound, body_outer_bound);
            node1.a = a3;
            node1.e = e;
            node1.mass = temp.VALUE;
            node1 = NULL;
            coalesced = true;
        } else
            node1 = node1.next_planet;
        }
        if (!(coalesced)) {
        node3 = new planetRecord();
        node3.a = a;
        node3.e = e;
        if ((mass >= crit_mass))
            node3.gasGiant = true;
        else
            node3.gasGiant = false;
        node3.mass = mass;
        if ((planet_head == NULL)) {
            planet_head = node3;
            node3.next_planet = NULL;
        } else {
            node1 = planet_head;
            if ((a < node1.a)) {
            node3.next_planet = node1;
            planet_head = node3;
            } else if ((planet_head.next_planet == NULL)) {
            planet_head.next_planet = node3;
            node3.next_planet = NULL;
            } else {
            while (((node1 != NULL) && (node1.a < a))) {
                node2 = node1;
                node1 = node1.next_planet;
            }
            node3.next_planet = node1;
            node2.next_planet = node3;
            }
        }
        }
    },

    stellarDustLimit: function(stellar_mass_ratio) {
        return (200.0 * Math.pow(stellar_mass_ratio, (1.0 / 3.0)));
    },

    innermostPlanet: function(stellar_mass_ratio) {
        return (0.3 * Math.pow(stellar_mass_ratio, (1.0 / 3.0)));
    },

    outermostPlanet: function(stellar_mass_ratio) {
        return (50.0 * Math.pow(stellar_mass_ratio, (1.0 / 3.0)));
    },

    innerEffectLimit: function(a, e, mass) {
        return (a * (1.0 - e) * (1.0 - mass) / (1.0 + cloud_eccentricity));
    },

    outerEffectLimit: function(a, e, mass) {
        return (a * (1.0 + e) * (1.0 + reduced_mass) / (1.0 - cloud_eccentricity));
    },

    /*--------------------------------------------------------------------------*/
    /* Orbital radius is in AU, eccentricity is unitless, and the stellar */
    /* luminosity ratio is with respect to the sun. The value returned is the */
    /* mass at which the planet begins to accrete gas as well as dust, and is */
    /* in units of solar masses. */
    /*--------------------------------------------------------------------------*/
    criticalLimit: function(orbital_radius, eccentricity, stellar_luminosity_ratio) {
        var temp, perihelion_dist;

        perihelion_dist = (orbital_radius - orbital_radius * eccentricity);
        temp = perihelion_dist * Math.sqrt(stellar_luminosity_ratio);
        return (B * Math.pow(temp, -0.75));
    }

});
