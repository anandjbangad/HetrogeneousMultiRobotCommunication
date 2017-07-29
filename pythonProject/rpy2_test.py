#!/usr/bin/env python

import rpy2.robjects as robjects

from rpy2.robjects.packages import importr
# import rpy2's package module
import rpy2.robjects.packages as rpackages
# import R's utility package
utils = rpackages.importr('utils')

# select a mirror for R packages
utils.chooseCRANmirror(ind=1) # select the first mirror in the list
# import R's "base" package
base = importr('base')
# R package names
packnames = ('ggplot2', 'hexbin', 'paaatcha/MCDM')

# R vector of strings
from rpy2.robjects.vectors import StrVector

# Selectively install what needs to be install.
# We are fancy, just because we can.
# names_to_install = [x for packnames if not rpackages.isinstalled(x)]
names_to_install = [x for x in packnames if not rpackages.isinstalled(x)]
if len(names_to_install) > 0:
    utils.install_packages(StrVector(names_to_install))

MCDA = importr('MCDA')


pi = robjects.r['pi']
print pi[0]


res1 = robjects.FloatVector([5490,51.4,8.5,285,6500,70.6,7,
                             288,6489,54.3,7.5,290])
performanceTable = robjects.r['matrix'](res1, nrow=3, ncol=4, byrow=True)
performanceTable.rownames = robjects.StrVector(["Corsa","Clio","Fiesta"])
performanceTable.colnames = robjects.StrVector(["Purchase Price","Economy","Aesthetics","Boot Capacity"])

weights = robjects.FloatVector([0.35,0.25,0.25,0.15])
weights.names = robjects.r['colnames'](performanceTable)

criteriaMinMax = robjects.StrVector(["min", "max", "max", "max"])

positiveIdealSolutions = robjects.FloatVector([0.179573776, 0.171636015, 0.159499658, 0.087302767])

negativeIdealSolutions = robjects.FloatVector([0.212610118, 0.124958799, 0.131352659, 0.085797547])

overall1 = robjects.r['TOPSIS'](performanceTable, weights, criteriaMinMax)

