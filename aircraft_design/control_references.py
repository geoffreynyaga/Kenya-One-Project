"""Book-backed reference records for control-surface geometry.

Static reference data lives in Python and is served through a cached GET, the
same pattern as the airfoil and aerodynamic-class catalogues. These rows are
decision support only: they show what several existing aircraft used, and no
sheet may copy them into an input as a default.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class RudderReferenceSource:
    """Where the rudder reference table came from."""

    title: str
    edition: str
    chapter: str
    table: str
    figure: str
    table_page: int
    figure_page: int
    context: str


@dataclass(frozen=True)
class RudderReferenceRow:
    """One verified row from Sadraey Table 12.20."""

    value: str
    aircraft: str
    aircraft_type: str
    mtow_kg: int
    rudder_area_ratio: float
    rudder_chord_ratio: float
    max_deflection_label: str | None
    crosswind_knot: int | None
    note: str


@dataclass(frozen=True)
class OmittedRudderReferenceRow:
    """A printed row intentionally left out of the selectable examples."""

    aircraft: str
    reason: str


@dataclass(frozen=True)
class RudderReferenceCatalog:
    """Selected rudder reference examples with source context."""

    source: RudderReferenceSource
    rows: tuple[RudderReferenceRow, ...]
    omitted_rows: tuple[OmittedRudderReferenceRow, ...]


RUDDER_REFERENCE_CATALOG = RudderReferenceCatalog(
    source=RudderReferenceSource(
        title="Aircraft Design: A Systems Engineering Approach",
        edition="Wiley, 2012",
        chapter="Chapter 12, Design of Control Surfaces",
        table="Table 12.20",
        figure="Figure 12.25",
        table_page=687,
        figure_page=686,
        context=(
            "Rudder area, chord, span, maximum deflection and inboard-edge "
            "location are the preliminary rudder parameters. Table rows are "
            "comparable-aircraft context, not input recommendations."
        ),
    ),
    rows=(
        RudderReferenceRow(
            "cessna_182",
            "Cessna 182",
            "Light GA",
            1406,
            0.38,
            0.42,
            "±24°",
            None,
            "Light general-aviation example, closest in class to a small propeller aircraft.",
        ),
        RudderReferenceRow(
            "cessna_650",
            "Cessna 650",
            "Business jet",
            9979,
            0.26,
            0.27,
            "±25°",
            None,
            "Business-jet comparison row.",
        ),
        RudderReferenceRow(
            "gulfstream_200",
            "Gulfstream 200",
            "Business jet",
            16080,
            0.30,
            0.32,
            "±20°",
            None,
            "Business-jet comparison row.",
        ),
        RudderReferenceRow(
            "lockheed_c_130e_hercules",
            "Lockheed C-130E Hercules",
            "Military cargo",
            70305,
            0.239,
            0.25,
            "±35°",
            None,
            "Large military-cargo example; useful only for scale context.",
        ),
        RudderReferenceRow(
            "boeing_737_100",
            "Boeing 737-100",
            "Transport",
            50300,
            0.25,
            0.26,
            None,
            None,
            "Transport comparison row; the printed table gives no maximum deflection.",
        ),
        RudderReferenceRow(
            "boeing_777_200",
            "Boeing 777-200",
            "Transport",
            247200,
            0.26,
            0.28,
            "±27.3°",
            None,
            "Transport comparison row.",
        ),
        RudderReferenceRow(
            "boeing_747_200",
            "Boeing 747-200",
            "Transport",
            377842,
            0.173,
            0.22,
            "±25°",
            30,
            "Transport comparison row with a printed cross-wind value.",
        ),
        RudderReferenceRow(
            "lockheed_c_5a",
            "Lockheed C-5A",
            "Cargo",
            381000,
            0.191,
            0.20,
            None,
            43,
            "Cargo comparison row; the printed table gives no maximum deflection.",
        ),
        RudderReferenceRow(
            "fokker_100a",
            "Fokker 100A",
            "Airliner",
            44450,
            0.23,
            0.28,
            "±20°",
            30,
            "Airliner comparison row with a printed cross-wind value.",
        ),
        RudderReferenceRow(
            "embraer_erj145",
            "Embraer ERJ145",
            "Regional jet",
            22000,
            0.29,
            0.31,
            "±15°",
            None,
            "Regional-jet comparison row.",
        ),
        RudderReferenceRow(
            "airbus_a340_600",
            "Airbus A340-600",
            "Airliner",
            368000,
            0.31,
            0.32,
            "±31.6°",
            None,
            "Airliner comparison row.",
        ),
    ),
    omitted_rows=(
        OmittedRudderReferenceRow(
            "Air Tractor AT-802",
            (
                "Omitted because the printed row classifies the aircraft as a "
                "regional airliner and gives an 18,600 kg mass; both conflict "
                "with the aircraft name."
            ),
        ),
        OmittedRudderReferenceRow(
            "DC-8",
            (
                "Omitted because the printed rudder chord ratio is 35, which "
                "is not dimensionally plausible for C_R/C_V."
            ),
        ),
        OmittedRudderReferenceRow(
            "DC-10",
            (
                "Omitted because the printed rudder chord ratio is 38, which "
                "is not dimensionally plausible for C_R/C_V."
            ),
        ),
    ),
)


__all__ = [
    "OmittedRudderReferenceRow",
    "RUDDER_REFERENCE_CATALOG",
    "RudderReferenceCatalog",
    "RudderReferenceRow",
    "RudderReferenceSource",
]
