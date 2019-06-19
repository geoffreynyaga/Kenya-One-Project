

def initialWeight(finalMTOW):
    initialRaymer = finalMTOW*0.97*0.985
    initialGud = finalMTOW*0.994*0.985
    initialSadraey = finalMTOW*0.98*0.97
    # print (initialSadraey,"sadraey")
    # print(initialGud,"gud")
    # print(initialRaymer,"raymer")
    return (initialRaymer+initialGud+initialSadraey)/3

def altitudeDensity(altitude,rhoSL):
    ### fetch this function in other script
    altitudeDensity = rhoSL * (1 - 0.0000068756 * altitude) ** 4.2561
    return altitudeDensity

