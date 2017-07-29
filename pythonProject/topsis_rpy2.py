#!/usr/bin/env python

import rpy2.robjects as robjects
from rpy2.robjects.packages import importr
import numpy as np
import logging, sys


MCDA = importr('MCDA')


def callAlgorithm(dataset, n_alternatives, m_criterias, minMaxArray, weightsV=None ):
    res1 = robjects.FloatVector(dataset)
    performanceTable = robjects.r['matrix'](res1, nrow=n_alternatives, ncol=m_criterias, byrow=True)
    #performanceTable.rownames = robjects.StrVector(["Corsa","Clio","Fiesta"])
    #performanceTable.colnames = robjects.StrVector(["Purchase Price","Economy","Aesthetics","Boot Capacity"])
    if weightsV is None:
        weights = robjects.FloatVector(np.full( m_criterias, fill_value=float(1)/m_criterias))
    else:
        weights = robjects.FloatVector(weightsV)
    #weights.names = robjects.r['colnames'](performanceTable)
    logging.debug("Weights is %s", weights.r_repr())
    criteriaMinMax = robjects.StrVector(minMaxArray)

    #positiveIdealSolutions = robjects.FloatVector([0.179573776, 0.171636015, 0.159499658, 0.087302767])

    #negativeIdealSolutions = robjects.FloatVector([0.212610118, 0.124958799, 0.131352659, 0.085797547])

    overall1 = robjects.r['TOPSIS'](performanceTable, weights, criteriaMinMax)

    logging.debug("overall is %s", overall1.r_repr())

    return robjects.r['which.max'](overall1)[0] -1


if __name__ == "__main__":
    logging.basicConfig(stream=sys.stderr, level=logging.DEBUG)  # logging.ERROR

    #output = callAlgorithm(dataset=[0.9,10,300,0.1,300,6], n_alternatives=2, m_criterias=3, weightsV=[1,1,1])
    output = callAlgorithm(dataset=[0.9, 10, 0.1, 6], n_alternatives=2, m_criterias=2, minMaxArray=["min", "min"])
    print(output)