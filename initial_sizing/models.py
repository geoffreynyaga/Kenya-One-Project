from django.db import models


class MTOW_Sizing(models.Model):
    """Model definition for MTOW_SIZING."""

    aircraft = models.ForeignKey("accounts.Aircraft", on_delete=models.CASCADE)

    pax = models.IntegerField(blank=True, null=True)
    pax_weight = models.IntegerField(blank=True, null=True)
    crew_number = models.IntegerField(blank=True, null=True)
    crew_single_weight = models.IntegerField(blank=True, null=True)
    luggage_weight_per_pax = models.FloatField(blank=True, null=True)
    total_payload_weight = models.FloatField()
    total_crew_weight = models.IntegerField()
    total_empty_weight = models.IntegerField()
    total_fuel_weight = models.IntegerField()

    empty_weight_constant_1 = models.FloatField()
    empty_weight_constant_2 = models.FloatField()

    propeller_efficiency = models.FloatField()
    cbhp = models.FloatField()
    ld_max = models.FloatField()

    range = models.IntegerField()
    endurance = models.FloatField(blank=True, null=True)

    mtow = models.FloatField()

    date_created = models.DateTimeField(auto_now_add=True)
    date_modified = models.DateTimeField(auto_now=True)

    class Meta:
        """Meta definition for MTOW_SIZING."""

        verbose_name = "MTOW_SIZING"
        verbose_name_plural = "MTOW_SIZINGs"

    def __str__(self) -> str:
        """Unicode representation of MTOW_SIZING."""
        return f"{self.aircraft} of MTOW {self.mtow}"


class Fuel_Fractions(models.Model):
    """Model definition for Fuel_Fractions."""

    aircraft = models.ForeignKey("accounts.Aircraft", on_delete=models.CASCADE)

    w1 = models.FloatField()
    w2 = models.FloatField()
    w3 = models.FloatField()
    w4 = models.FloatField()
    w5 = models.FloatField()
    w6 = models.FloatField()

    class Meta:
        """Meta definition for Fuel_Fractions."""

        verbose_name = "Fuel_Fractions"
        verbose_name_plural = "Fuel_Fractionss"

    def __str__(self):
        """Unicode representation of Fuel_Fractions."""
        pass


class Sref_and_Power_Sizing(models.Model):
    """Model definition for Sref_and_Power_Sizing."""

    # Stall Speed Requirement
    cl_max = models.FloatField()
    v_stall = models.FloatField()

    # Max speed requirement
    v_max = models.FloatField()
    cdo = models.FloatField()
    aspect_ratio = models.FloatField()

    # Take-off Run Requirement
    S_to = models.IntegerField()  # distance to 50ft clearance
    CL_to = models.FloatField()

    CDOHLD_TO = models.FloatField(default=0.005)  # Sadraey Suggests0.003 to 0.008
    CDoTO = models.FloatField()
    CDTO = models.FloatField()
    CLR = models.FloatField()
    prop_efficiency_to = models.FloatField()
    CDG = models.FloatField()
    runway_friction_coefficient = models.FloatField(default=0.04)

    # rate of climb requirements
    rate_of_climb = models.IntegerField()
    prop_efficiency_climb = models.FloatField()
    # service_ceiling_requirements
    ceiling = models.IntegerField()
    rate_of_climb_ceiling = models.FloatField()

    # from the graph
    power_loading = models.FloatField()
    wing_loading = models.FloatField()

    Sref = models.FloatField()  # m3
    power_required = models.FloatField()  # hp

    number_of_engines = models.IntegerField(default=1)
    power_per_engine = models.FloatField()

    engine_weight = models.FloatField()  # (lb) from manufacturer WENG
    engine_power = models.FloatField()  # (hp) from manufacturer WENG

    class Meta:
        """Meta definition for Sref_and_Power_Sizing."""

        verbose_name = "Sref_and_Power_Sizing"
        verbose_name_plural = "Sref_and_Power_Sizings"

    def __str__(self):
        """Unicode representation of Sref_and_Power_Sizing."""
        pass


class Performance_Constraints(models.Model):
    """Model definition for Performance_Constraints."""

    ground_run = models.IntegerField()  # ground run SG ft
    altitude = models.FloatField()  # 	ft
    oswalds_efficiency = models.FloatField()  # e
    k = models.FloatField()

    altitude = models.IntegerField()
    ρalt = models.FloatField()

    altitude = models.IntegerField()  # ft
    rho_alt = models.FloatField()  # slug/ft3
    rho_sigma = models.IntegerField()  # σ = rho_alt/rho_sl

    turn_load_factor = models.FloatField()  # (turn load factor)
    Vv = models.IntegerField()  # 	fpm
    V_climb = models.FloatField()  # knots
    vc = models.FloatField()  # 	ktas
    service_ceiling = (
        models.IntegerField()
    )  # different from ceiling in the class above ft
    rho_service_ceiling = models.FloatField()  # 	0.001065581
    ηp_alt = models.FloatField()  # ηp_alt  propeller efficiency at the desired altitude
    rho_sigma_sc = models.FloatField()  # σSC air density ratio at service ceiling

    # Final Surface Area
    S = models.FloatField()  # ft2

    class Meta:
        """Meta definition for Performance_Constraints."""

        verbose_name = "Performance_Constraints"
        verbose_name_plural = "Performance_Constraintss"

    def __str__(self):
        """Unicode representation of Performance_Constraints."""
        pass


class Detailed_Weights(models.Model):
    """Model definition for Detailed_Weights."""

    wing = models.FloatField()  # lbs
    wing_dist_from_nose = models.FloatField()  # m

    main_gear = models.FloatField()  # lbs
    main_gear_dist_from_nose = models.FloatField()  # ft

    nose_gear = models.FloatField()  # lbs
    nose_gear_dist_from_nose = models.FloatField()  # ft

    horizontal_tail = models.FloatField()  # lbs
    horizontal_tail_dist_from_nose = models.FloatField()  # ft

    vertical_tail = models.FloatField()  # lbs
    vertical_tail_dist_from_nose = models.FloatField()  # ft

    fuselage = models.FloatField()  # lbs
    fuselage_dist_from_nose = models.FloatField()  # ft

    installed_engine = models.FloatField()  # lbs
    installed_engine_dist_from_nose = models.FloatField()  # ft

    fuel_system = models.FloatField()  # lbs
    fuel_system_dist_from_nose = models.FloatField()  # ft

    flight_control = models.FloatField()  # lbs
    flight_control_dist_from_nose = models.FloatField()  # ft

    hydraulic_system = models.FloatField()  # lbs
    hydraulic_system_dist_from_nose = models.FloatField()  # ft

    avionic_system = models.FloatField()  # lbs
    avionic_system_dist_from_nose = models.FloatField()  # ft

    electrical_system = models.FloatField()  # lbs
    electrical_system_dist_from_nose = models.FloatField()  # ft

    furnishings = models.FloatField()  # lbs
    furnishings_dist_from_nose = models.FloatField()  # ft

    S_fuselage = models.FloatField()  # m2
    fuselage_length = (
        models.FloatField()
    )  # (m) length of fuselage minus tail cone and radome i.e forward bulkhead to aft frame
    cabin_pressure_differential = models.IntegerField(
        default=0
    )  # ΔP cabin pressurization diffrential, 0 for unpressurized, 8 psi for pressurised cabin
    pressurized_cabin_volume = (
        models.FloatField()
    )  # (ft3) volume of pressurized cabin section
    fuselage_structure_depth = (
        models.FloatField()
    )  # (ft) DEPTH OF FUSELAGE STRUCTURE dFS
    fuselage_max_width = models.FloatField()  # (ft) fuselage max width wF
    fuselage_max_depth = models.FloatField()  # (ft) fuselage max width dF

    main_gear_struct_length = models.FloatField()  # (in) length of main gear strut Lm
    nose_gear_struct_length = models.FloatField()  # (in) length of nose gear strut Ln
    fuel_tanks_number = models.IntegerField()  # (in) NTANK
    LE_distance = (
        models.FloatField()
    )  # (m) DISTANCE OF WING LEADING EDGE TO NOSE(DATUM) LEDIST
    Wiae = models.FloatField()  # (lb) weight of instrument+avionivs+electronics
    integral_tanks_number = models.IntegerField(
        default=0
    )  # NUMBER OF INTEGRAL TANKS NINT
    integral_tanks_fuel = models.IntegerField(
        default=0
    )  # FUEL IN EACH INTEGRAL TANK  FINT
    integral_tanks__total_fuel = models.IntegerField(
        default=0
    )  # TOTAL FUEL IN ALL INTEGRAL TANKS  TFINT

    class Meta:
        """Meta definition for Detailed_Weights."""

        verbose_name = "Detailed_Weights"
        verbose_name_plural = "Detailed_Weights"

    def __str__(self):
        """Unicode representation of Detailed_Weights."""
        pass
