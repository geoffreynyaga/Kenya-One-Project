import math
from aerocalc import std_atm as ISA  # type: ignore
import numpy as np  # type: ignore
import matplotlib  # type: ignore
import matplotlib.pylab as pylab  # type: ignore
import matplotlib.pyplot as plt  # type: ignore

from intersection import get_intersection_index


from typing import Any


class AndrasConstraint:
    def __init__(self):
        self.VariableName_unit: int = 0
        # Variable names ending in an underscore are non-dimensional:
        self.VariableName_: int = 0
        self.DesignGrossWeight_kg: int = 15

        self.PropEff: float = 0.6

        # Take-off performance
        self.GroundRun_feet: int = 197
        self.TakeOffSpeed_KCAS: int = 31
        self.TakeOffElevation_feet: int = 0
        # Cruise
        # The cruising altitude may be viewed in two fundamentalways. First, itmay be a constraint – for
        # example, due to regulatory requirements the aircraft may have to cruise at, say, 350 feet. It can
        # also be viewed as a design variable, in which case you may wish to return to this point in the
        # document and revise it as part of an iterative process of optimization / reinement.
        self.CruisingAlt_feet: int = 400
        self.CruisingSpeed_KTAS: float = 58.3

        # Climb Performance
        # The climb performance of an aircraft and its variation with altitude is the result of
        # a complex web of interactions between the aerodynamics of lift generation and the
        # response of its powerplant to varying atmospheric conditions and airspeed. Typically a
        # range of design points have to be considered, representing a variety of conditions, but
        # at this early stage in the design process it is best to keep the number of these design
        # points at a more manageable level. Here we use 80% of the cruise speed for the climb
        # constraint.
        self.RateOfClimb_fpm: int = 591
        self.ClimbSpeed_KCAS = self.CruisingSpeed_KTAS * 0.8
        # The rate of climb constraint will be evaluated at this altitude:
        self.ROCAlt_feet: int = 0

        # Turn Performance
        # We deine steady, level turn performance in terms of the load factor n (which represents the
        # ratio of lift and weight). n = 1∕ cos ���, where ��� is the bank angle (so n = 1.41 corresponds to
        # 45∘, n = 2 corresponds to 60∘, etc.).
        self.n_cvt_: float = 1.41
        # Service Ceiling
        self.ServiceCeiling_feet: int = 500

        # Approach and Landing
        self.ApproachSpeed_KTAS: float = 29.5
        # We deine the margin by which the aircraft operates above its stall speed on inal approach
        # (e.g., a reserve factor of 1.2 – typical of manned military aircraft – means lying 20% above
        # stall, a reserve factor of 1.3 – typical of civil aircraft, means 30% above stall; for small UAVs,
        # lower values may be considered).
        self.StallReserveFactor: float = 1.1
        self.StallSpeedinApproachConf_KTAS = (
            self.ApproachSpeed_KTAS / self.StallReserveFactor
        )
        print(
            f"Stall speed in approach configuration: {self.StallSpeedinApproachConf_KTAS} KTAS"
        )
        # Stall speed in approach configuration: 26.8 KTAS
        # Maximum lift coeficient in landing coniguration:
        self.CLmax_approach: float = 1.3
        # We also deine the highest altitude AMSL where we would expect the aircraft to be established
        # on a stable inal approach in landing coniguration:
        self.TopOfFinalApp_feet: int = 100

        # Unit Conversions
        # All constraint analysis calculations in this document are performed in SI units. However, it is
        # more common to specify some elements of the design brief in the mix of SI and Imperial units
        # traditionally used in aviation – here we perform the appropriate conversions.
        self.CruisingAlt_m = self.CruisingAlt_feet * 0.3048
        print(f"Cruising altitude: {self.CruisingAlt_m}")
        # Cruising altitude: 122 m
        self.TopOfFinalApp_m = self.TopOfFinalApp_feet * 0.3048
        print(f"Top of final approach: {self.TopOfFinalApp_m} m")
        # Top of final approach: 30 m
        self.TakeOffElevation_m = self.TakeOffElevation_feet * 0.3048
        print(f"Take-off runway elevation: {self.TakeOffElevation_m} m")
        # Take-off runway elevation: 0 m
        self.ServiceCeiling_m = self.ServiceCeiling_feet * 0.3048
        print(f"Service ceiling: {self.ServiceCeiling_m} m")
        # Service ceiling: 152 m
        self.CruisingSpeed_mpsTAS = self.CruisingSpeed_KTAS * 0.5144444444
        print(f"Cruising speed: {self.CruisingSpeed_mpsTAS} m/s TAS")
        # Cruising speed: 30.0 m/s TAS
        self.ClimbSpeed_mpsCAS = self.ClimbSpeed_KCAS * 0.5144444444
        print(f"Climb speed: {self.ClimbSpeed_mpsCAS} m/s CAS")
        # Climb speed: 24.0 m/s CAS
        self.ApproachSpeed_mpsTAS = self.ApproachSpeed_KTAS * 0.5144444444
        print(f"Approach speed: {self.ApproachSpeed_mpsTAS} m/s TAS")
        # Approach speed: 15.2 m/s TAS
        self.StallSpeedinApproachConf_mpsTAS = (
            self.StallSpeedinApproachConf_KTAS * 0.51444444444
        )
        print(
            f"Stall speed in approach configuration: {self.StallSpeedinApproachConf_mpsTAS} m/s TAS"
        )
        # Stall speed in approach configuration: 13.8 m/s TAS
        self.RateOfClimb_mps = self.RateOfClimb_fpm * 0.00508
        print(f"Rate of climb: {self.RateOfClimb_mps} m/s")
        # Rate of climb: 3.0 m/s
        self.TakeOffSpeed_mpsCAS = self.TakeOffSpeed_KCAS * 0.5144444444
        print(f"Take-off speed: {self.TakeOffSpeed_mpsCAS} m/s CAS")
        # Take-off speed: 15.9 m/s CAS
        self.GroundRun_m = self.GroundRun_feet * 0.3048
        print(f"Ground run: {self.GroundRun_m} m")
        # Ground run: 60 m

        # Basic Geometry and Initial Guesses
        # Almost by deinition, the early part of the conceptual design process is the only part of the
        # product development where we do not yet have a geometry model to refer to. Thus, some of
        # the all-important aerodynamic igures have to be guessed at this point, largely on the basis of
        # high level geometrical parameters like the aspect ratio.
        self.AspectRatio_: float = 9.0
        self.CDmin: float = 0.0418
        self.WSmax_kgm2: float = 20
        self.TWmax: float = 0.6
        self.Pmax_kW: float = 4
        # Estimated take-off parameters
        self.CLTO: float = 0.97
        self.CDTO: float = 0.0898
        self.muTO: float = 0.17

        self.Resolution = 2000
        self.Start_Pa = 0.1

        # Preamble
        # Some of the computations and visualizations performed in this document may require additional
        # Python modules; these need to be loaded irst as follows:
        # get_ipython().run_line_magic("matplotlib", "inline")

        # Preliminary Calculations
        # The Operating Environment
        # The environment in which the aircraft is expected to operate plays a very important role in
        # many of the conceptual design calculations to follow. The conditions corresponding to the
        # current design brief are computed as follows:
        self.SeaLevelDens_kgm3 = ISA.alt2density(
            0, alt_units="ft", density_units="kg/m**3"
        )
        print(f" ISA density at Sea level elevation: {self.SeaLevelDens_kgm3} kg/m^3")
        # ISA density at Sea level elevation: 1.225 kg/m^3
        self.TakeOffDens_kgm3 = ISA.alt2density(
            self.TakeOffElevation_feet, alt_units="ft", density_units="kg/m**3"
        )
        print(f" ISA density at take-off elevation: {self.TakeOffDens_kgm3} kg/m^3")
        # ISA density at take-off elevation: 1.225 kg/m^3
        self.ClimbAltDens_kgm3 = ISA.alt2density(
            self.ROCAlt_feet, alt_units="ft", density_units="kg/m**3"
        )
        print(
            f" ISA density at the climb constraint altitude: {self.ClimbAltDens_kgm3} kg/m^3"
        )
        # ISA density at the climb constraint altitude: 1.225 kg/m^3
        self.CruisingAltDens_kgm3 = ISA.alt2density(
            self.CruisingAlt_feet, alt_units="ft", density_units="kg/m**3"
        )
        print(f" ISA density at cruising altitude: {self.CruisingAltDens_kgm3} kg/m^3")
        # ISA density at cruising altitude: 1.211 kg/m^3
        # Concept Design: Initial Constraint Analysis 153
        self.TopOfFinalAppDens_kgm3 = ISA.alt2density(
            self.TopOfFinalApp_feet, alt_units="ft", density_units="kg/m**3"
        )
        print(
            f" ISA density at the top of the final approach: {self.TopOfFinalAppDens_kgm3} kg/m^3"
        )
        # ISA density at the top of the final approach: 1.221 kg/m^3

        # Basic Aerodynamic Performance Calculations
        # In the absence of a geometry, at this stage any aerodynamic performance estimates will either
        # be based on very basic physics or simple, empirical equations.
        # We begin with a very rough estimate of the Oswald span eficiency, only suitable for moderate
        # aspect ratios and sweep angles below 30∘ (equation due to Raymer):
        self.e0 = 1.78 * (1 - 0.045 * self.AspectRatio_ ** 0.68) - 0.64
        print(f"{self.e0} ")
        # 0.783
        # Lift induced drag factor self.k (Cd = Cd0
        # + kC2
        # l ):
        self.k = 1.0 / (math.pi * self.AspectRatio_ * self.e0)
        print(f"{self.k}")
        # 0.045
        # Dynamic pressure at cruise
        self.q_cruise_Pa = (
            0.5 * self.CruisingAltDens_kgm3 * (self.CruisingSpeed_mpsTAS ** 2)
        )
        print(f"{self.q_cruise_Pa} Pa")
        # 544.5 Pa
        # Dynamic pressure in the climb
        self.q_climb_Pa = 0.5 * self.ClimbAltDens_kgm3 * (self.ClimbSpeed_mpsCAS ** 2)
        print(f"{self.q_climb_Pa} Pa")
        # 352.6 Pa
        # Dynamic pressure at take-off conditions – for the purposes of this simple approximation we
        # assume the acceleration during the take-off run to decrease linearly with ���2, so for the ���2 term
        # we’ll use half of the square of the liftoff velocity (i.e., ��� = ���TO∕
        # √
        # 2):
        self.q_TO_Pa = (
            0.5 * self.TakeOffDens_kgm3 * (self.TakeOffSpeed_mpsCAS / math.sqrt(2)) ** 2
        )
        print(f"{self.q_TO_Pa} Pa")
        # 77.9 Pa
        self.q_APP_Pa = (
            0.5
            * self.TopOfFinalAppDens_kgm3
            * self.StallSpeedinApproachConf_mpsTAS ** 2
        )
        print(f"{self.q_APP_Pa} Pa")
        # 116.2 Pa

    def ConstraintPoly(
        self, WS_Array: list, TW_Array: list, color: str, color_alfa: float
    ) -> Any:
        WS_Array.append(WS_Array[-1])
        TW_Array.append(0)
        WS_Array.append(WS_Array[0])
        TW_Array.append(0)
        WS_Array.append(0)
        TW_Array.append(TW_Array[-2])
        zp = zip(WS_Array, TW_Array)
        print(zp, "zp")
        print(type(zp), " type of zp")
        #     print(list(zp), " list of zp")

        pa = matplotlib.patches.Polygon(
            list(zp), closed=True, color=color, alpha=color_alfa
        )
        return pa

    # Next, we deine a method for setting the appropriate bounds on each constraint diagram:
    def PlotSetUp(self, Xmin, Xmax, Ymin, Ymax, Xlabel, Ylabel):
        pylab.ylim([Ymin, Ymax])
        pylab.xlim([Xmin, Xmax])
        pylab.ylabel(Ylabel)
        pylab.xlabel(Xlabel)

    # Constraints
    # With the basic numbers of the current conceptual design iteration in place, we now draw up
    # the boundaries of the wing loading W∕S versus thrust to weight ratio T∕W design domain.
    # These boundaries are representations of the basic constraints that enforce the adherence of the
    # design to the numbers speciied in the design brief.

    # Constraint 1: Level, Constant Velocity Turn
    def constant_velocity_turn_constraint(self):

        # First, we compute the thrust to weight ratio required to maintain a speciic load factor n in a
        # level turn at the cruise altitude
        WSlistCVT_Pa = np.linspace(self.Start_Pa, 8500, self.Resolution)
        TWlistCVT = []
        i = 0
        for WS in WSlistCVT_Pa:
            TW = self.q_cruise_Pa * (
                self.CDmin / WSlistCVT_Pa[i]
                + WSlistCVT_Pa[i] * self.k * (self.n_cvt_ / self.q_cruise_Pa) ** 2
            )
            TWlistCVT.append(TW)
            i = i + 1
        WSlistCVT_kgm2 = [x * 0.101971621 for x in WSlistCVT_Pa]
        print(WSlistCVT_kgm2[:10])
        print(TWlistCVT[:10])

        # The load factor n is the inverse of the cosine of the bank angle (denoted here by ���) so the
        # latter can be calculated as: ��� = cos−1
        # (
        # 1
        # n
        # )
        # so ���, in degrees, equals:
        theta_deg = math.acos(1 / self.n_cvt_) * 180 / math.pi
        print(f"{theta_deg}\xb0")
        # 45∘

        ConstVeloTurnPoly = self.ConstraintPoly(
            WSlistCVT_kgm2, TWlistCVT, "magenta", 0.1
        )

        figCVT = plt.figure()
        self.PlotSetUp(
            0, self.WSmax_kgm2, 0, self.TWmax, "$W/S\,[\,kg/m^2]$", "$T/W\,[\,\,]$"
        )
        axCVT = figCVT.add_subplot(111)
        axCVT.add_patch(ConstVeloTurnPoly)

        return {"combined_data": (WSlistCVT_kgm2, TWlistCVT, "magenta", 0.1)}

    # Constraint 2: Rate of Climb
    def rate_of_climb_constraint(self):

        WSlistROC_Pa = np.linspace(self.Start_Pa, 8500, self.Resolution)
        TWlistROC = []
        i = 0
        for WS in WSlistROC_Pa:
            TW = (
                self.RateOfClimb_mps / self.ClimbSpeed_mpsCAS
                + self.CDmin * self.q_climb_Pa / WSlistROC_Pa[i]
                + self.k * WSlistROC_Pa[i] / self.q_climb_Pa
            )
            TWlistROC.append(TW)
            i = i + 1
        WSlistROC_kgm2 = [x * 0.101971621 for x in WSlistROC_Pa]

        RateOfClimbPoly = self.ConstraintPoly(WSlistROC_kgm2, TWlistROC, "blue", 0.1)
        figROC = plt.figure()
        self.PlotSetUp(
            0, self.WSmax_kgm2, 0, self.TWmax, "$W/S\,[\,kg/m^2]$", "$T/W\,[\,\,]$"
        )
        axROC = figROC.add_subplot(111)
        axROC.add_patch(RateOfClimbPoly)

        return {"combined_data": (WSlistROC_kgm2, TWlistROC, "blue", 0.1)}

    # Constraint 3: Take-Off Ground Run Constraint
    def take_off_run_constraint(self):
        WSlistGR_Pa = np.linspace(self.Start_Pa, 8500, self.Resolution)
        TWlistGR = []
        i = 0
        for WS in WSlistGR_Pa:
            TW = (
                (self.TakeOffSpeed_mpsCAS ** 2) / (2 * 9.81 * self.GroundRun_m)
                + self.q_TO_Pa * self.CDTO / WSlistGR_Pa[i]
                + self.muTO * (1 - self.q_TO_Pa * self.CLTO / WSlistGR_Pa[i])
            )
            TWlistGR.append(TW)
            i = i + 1
        WSlistGR_kgm2 = [x * 0.101971621 for x in WSlistGR_Pa]

        TORunPoly = self.ConstraintPoly(WSlistGR_kgm2, TWlistGR, "green", 0.1)
        figTOR = plt.figure()
        self.PlotSetUp(
            0, self.WSmax_kgm2, 0, self.TWmax, "$W/S\,[\,kg/m^2]$", "$T/W\,[\,\,]$"
        )
        axTOR = figTOR.add_subplot(111)
        axTOR.add_patch(TORunPoly)
        return {"combined_data": (WSlistGR_kgm2, TWlistGR, "green", 0.1)}

    # Desired Cruise Airspeed
    def cruise_airspeed_constraint(self):

        WSlistCR_Pa = np.linspace(self.Start_Pa, 8500, self.Resolution)
        TWlistCR = []
        i = 0
        for WS in WSlistCR_Pa:
            TW = (
                self.q_cruise_Pa * self.CDmin * (1.0 / WSlistCR_Pa[i])
                + self.k * (1 / self.q_cruise_Pa) * WSlistCR_Pa[i]
            )
            TWlistCR.append(TW)
            i = i + 1
        WSlistCR_kgm2 = [x * 0.101971621 for x in WSlistCR_Pa]
        CruisePoly = self.ConstraintPoly(WSlistCR_kgm2, TWlistCR, "red", 0.1)

        figCruise = plt.figure()
        self.PlotSetUp(
            0, self.WSmax_kgm2, 0, self.TWmax, "$W/S\,[\,kg/m^2]$", "$T/W\,[\,\,]$"
        )
        axCruise = figCruise.add_subplot(111)
        axCruise.add_patch(CruisePoly)

        return {"combined_data": (WSlistCR_kgm2, TWlistCR, "red", 0.1)}

    # Constraint 5: Approach Speed

    def approach_speed_constraint(self):
        self.WS_APP_Pa = self.q_APP_Pa * self.CLmax_approach
        self.WS_APP_kgm2 = self.WS_APP_Pa * 0.101971621
        print(f"{self.WS_APP_kgm2} kg/m^2")
        # 15.41 kg/m^2
        WSlistAPP_kgm2 = [
            self.WS_APP_kgm2,
            self.WSmax_kgm2,
            self.WSmax_kgm2,
            self.WS_APP_kgm2,
            self.WS_APP_kgm2,
        ]
        TWlistAPP = [0, 0, self.TWmax, self.TWmax, 0]
        AppStallPoly = self.ConstraintPoly(WSlistAPP_kgm2, TWlistAPP, "grey", 0.1)
        figAPP = plt.figure()
        self.PlotSetUp(
            0, self.WSmax_kgm2, 0, self.TWmax, "$W/S\,[\,kg/m^2]$", "$T/W\,[\,\,]$"
        )
        axAPP = figAPP.add_subplot(111)
        axAPP.add_patch(AppStallPoly)

        return {"combined_data": (WSlistAPP_kgm2, TWlistAPP, "grey", 0.1)}

    # Combined Constraint Diagram

    def combined_constraint_diagram(self):

        figCOMP = plt.figure(figsize=(10, 10))
        self.PlotSetUp(
            0, self.WSmax_kgm2, 0, self.TWmax, "$W/S\,[\,kg/m^2]$", "$T/W\,[\,\,]$"
        )
        axCOMP = figCOMP.add_subplot(111)

        (
            WS_Array,
            TW_Array,
            color,
            color_alfa,
        ) = self.constant_velocity_turn_constraint()["combined_data"]

        velocity_TW_Array = TW_Array

        ConstVeloTurnPoly = self.ConstraintPoly(WS_Array, TW_Array, color, color_alfa)

        axCOMP.add_patch(ConstVeloTurnPoly)

        (WS_Array, TW_Array, color, color_alfa) = self.rate_of_climb_constraint()[
            "combined_data"
        ]

        RateOfClimbPoly = self.ConstraintPoly(WS_Array, TW_Array, color, color_alfa)
        axCOMP.add_patch(RateOfClimbPoly)

        (WS_Array, TW_Array, color, color_alfa) = self.take_off_run_constraint()[
            "combined_data"
        ]

        TORunPoly = self.ConstraintPoly(WS_Array, TW_Array, color, color_alfa)
        axCOMP.add_patch(TORunPoly)

        (WS_Array, TW_Array, color, color_alfa) = self.cruise_airspeed_constraint()[
            "combined_data"
        ]
        CruisePoly = self.ConstraintPoly(WS_Array, TW_Array, color, color_alfa)
        axCOMP.add_patch(CruisePoly)

        (WS_Array, TW_Array, color, color_alfa) = self.approach_speed_constraint()[
            "combined_data"
        ]

        AppStallPoly = self.ConstraintPoly(WS_Array, TW_Array, color, color_alfa)
        axCOMP.add_patch(AppStallPoly)
        axCOMP.legend(["Turn", "Climb", "T/O run", "Cruise", "App Stall"])
        textstr = "\n The feasible aeroplanelives\n in this white space"
        axCOMP.text(
            0.05,
            0.95,
            textstr,
            transform=axCOMP.transAxes,
            fontsize=14,
            verticalalignment="top",
        )

        # Since propeller and piston engine driven aircraft are normally designed in terms of engine
        # power rather than thrust, we next convert the constraint diagram from thrust to weight
        # ratio into an installed power requirement by specifying a propulsive eficiency ��� = 0.6
        # (note that un-supercharged piston engine power varies with altitude so we also allow for
        # this in the conversion using the Gagg and Ferrar model (see Gudmundsson [15]) with
        # PowerSL = Power∕(1.132��� − 0.132) where ��� is the air density ratio):

        WSlistCVT_Pa = np.linspace(self.Start_Pa, 8500, self.Resolution)
        PlistCVT_kW = []
        i = 0
        for WS in WSlistCVT_Pa:
            TW = self.q_cruise_Pa * (
                self.CDmin / WSlistCVT_Pa[i]
                + WSlistCVT_Pa[i] * self.k * (self.n_cvt_ / self.q_cruise_Pa) ** 2
            )
            P_kW = (
                9.81
                * TW
                * self.DesignGrossWeight_kg
                * self.CruisingSpeed_mpsTAS
                / self.PropEff
                / (1.132 * self.CruisingAltDens_kgm3 / self.SeaLevelDens_kgm3 - 0.132)
                / 1000
            )
            PlistCVT_kW.append(P_kW)
            i = i + 1
        WSlistCVT_kgm2 = [x * 0.101971621 for x in WSlistCVT_Pa]

        WSlistROC_Pa = np.linspace(self.Start_Pa, 8500, self.Resolution)
        PlistROC_kW = []
        i = 0
        for WS in WSlistROC_Pa:
            TW = (
                self.RateOfClimb_mps / self.ClimbSpeed_mpsCAS
                + self.CDmin * self.q_climb_Pa / WSlistROC_Pa[i]
                + self.k * WSlistROC_Pa[i] / self.q_climb_Pa
            )
            P_kW = (
                9.81
                * TW
                * self.DesignGrossWeight_kg
                * self.ClimbSpeed_mpsCAS
                / self.PropEff
                / (1.132 * self.ClimbAltDens_kgm3 / self.SeaLevelDens_kgm3 - 0.132)
                / 1000
            )
            PlistROC_kW.append(P_kW)
            i = i + 1
        WSlistROC_kgm2 = [x * 0.101971621 for x in WSlistROC_Pa]

        WSlistGR_Pa = np.linspace(self.Start_Pa, 8500, self.Resolution)
        PlistGR_kW = []
        i = 0
        for WS in WSlistGR_Pa:
            TW = (
                (self.TakeOffSpeed_mpsCAS ** 2) / (2 * 9.81 * self.GroundRun_m)
                + self.q_TO_Pa * self.CDTO / WSlistGR_Pa[i]
                + self.muTO * (1 - self.q_TO_Pa * self.CLTO / WSlistGR_Pa[i])
            )
            P_kW = (
                9.81
                * TW
                * self.DesignGrossWeight_kg
                * self.TakeOffSpeed_mpsCAS
                / self.PropEff
                / (1.132 * self.TakeOffDens_kgm3 / self.SeaLevelDens_kgm3 - 0.132)
                / 1000
            )
            PlistGR_kW.append(P_kW)
            i = i + 1
        WSlistGR_kgm2 = [x * 0.101971621 for x in WSlistGR_Pa]

        WSlistCR_Pa = np.linspace(self.Start_Pa, 8500, self.Resolution)
        PlistCR_kW = []
        i = 0
        for WS in WSlistCR_Pa:
            TW = (
                self.q_cruise_Pa * self.CDmin * (1.0 / WSlistCR_Pa[i])
                + self.k * (1 / self.q_cruise_Pa) * WSlistCR_Pa[i]
            )
            P_kW = (
                9.81
                * TW
                * self.DesignGrossWeight_kg
                * self.CruisingSpeed_mpsTAS
                / self.PropEff
                / (1.132 * self.CruisingAltDens_kgm3 / self.SeaLevelDens_kgm3 - 0.132)
                / 1000
            )
            PlistCR_kW.append(P_kW)
            i = i + 1
        WSlistCR_kgm2 = [x * 0.101971621 for x in WSlistCR_Pa]

        WSlistAPP_kgm2 = [
            self.WS_APP_kgm2,
            self.WSmax_kgm2,
            self.WSmax_kgm2,
            self.WS_APP_kgm2,
            self.WS_APP_kgm2,
        ]
        PlistAPP_kW = [0, 0, self.Pmax_kW, self.Pmax_kW, 0]

        figCOMP = plt.figure(figsize=(10, 10))
        self.PlotSetUp(
            0, self.WSmax_kgm2, 0, self.Pmax_kW, "$W/S\,[\,kg/m^2]$", "$P\,[\,kW]$"
        )
        axCOMP = figCOMP.add_subplot(111)
        ConstVeloTurnPoly = self.ConstraintPoly(
            WSlistCVT_kgm2, PlistCVT_kW, "magenta", 0.6
        )
        axCOMP.add_patch(ConstVeloTurnPoly)
        RateOfClimbPoly = self.ConstraintPoly(WSlistROC_kgm2, PlistROC_kW, "blue", 0.6)
        axCOMP.add_patch(RateOfClimbPoly)

        if np.array(PlistCVT_kW).shape < np.array(PlistROC_kW).shape:
            truncate_value, = np.array(PlistCVT_kW).shape
            PlistROC_kW = PlistROC_kW[:truncate_value]
        else:
            truncate_value, = np.array(PlistROC_kW).shape

            PlistCVT_kW = PlistCVT_kW[:truncate_value]

        intersect_value = get_intersection_index(
            np.array(PlistCVT_kW), np.array(PlistROC_kW)
        )

        print(intersect_value, "<<<<<<<<<<<<<<<< intersect_value")
        print(WSlistROC_kgm2[intersect_value], "WSlistROC_kgm2[intersect_value] ")
        print(WSlistCVT_kgm2[intersect_value], "WSlistCVT_kgm2[intersect_value] ")

        print(PlistCVT_kW[intersect_value], "PlistCVT_kW[intersect_value] ")
        print(PlistROC_kW[intersect_value], "velocity_TW_Array[intersect_value] ")

        TORunPoly = self.ConstraintPoly(WSlistGR_kgm2, PlistGR_kW, "green", 0.1)
        axCOMP.add_patch(TORunPoly)
        CruisePoly = self.ConstraintPoly(WSlistCR_kgm2, PlistCR_kW, "red", 0.1)
        axCOMP.add_patch(CruisePoly)
        AppStallPoly = self.ConstraintPoly(WSlistAPP_kgm2, PlistAPP_kW, "grey", 0.1)
        axCOMP.add_patch(AppStallPoly)
        axCOMP.legend(["Turn", "Climb", "T/O run", "Cruise", "App Stall"])
        textstr = "\n The feasible aeroplanelives\n in this white space"
        axCOMP.text(
            0.05,
            0.95,
            textstr,
            transform=axCOMP.transAxes,
            fontsize=14,
            verticalalignment="top",
        )

        print(figCOMP, "figCOMP")

        # figCOMP.show()
        plt.show()


constraint = AndrasConstraint()
constraint.combined_constraint_diagram()
