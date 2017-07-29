#!/usr/bin/env python
import math
import numpy as np
from sklearn.preprocessing import normalize

places = ("Bali", "Bibione", "Karibik")

# dataset = ( travel expenses( Bali(tom,Petr, Jan), Bibione(tom,Petr, Jan), Karibik(tom,Petr, Jan)),
#   accommodation expenses( Bali(tom,Petr, Jan), Bibione(tom,Petr, Jan), Karibik(tom,Petr, Jan)),
#   entertainment( Bali(tom,Petr, Jan), Bibione(tom,Petr, Jan), Karibik(tom,Petr, Jan)),
#   swimming quality( Bali(tom,Petr, Jan), Bibione(tom,Petr, Jan), Karibik(tom,Petr, Jan) ) )
dataset = (
  ( (6,2,4),(5,2,2),(1,1,1) ),   # travel expenses
  ( (8,8,5),(6,2,4),(3,2,4) ),   # accommodation expenses
  ( (4,2,3),(9,9,3),(9,9,9) ),   # entertainment
  ( (4,5,6),(2,1,3),(10,10,7) )    # swimming quality
)

# weights can be thought of concised form of dataset

# weights, criterions = [ travel expenses[Bali, Bibione, Karibik],
#   accommodation expenses[Bali, Bibione, Karibik],
#   entertainment[Bali, Bibione, Karibik],
#   swimming quality[Bali, Bibione, Karibik] ]
weights = [
  [0.0, 0.0, 0.0],
  [0.0, 0.0, 0.0],
  [0.0, 0.0, 0.0],
  [0.0, 0.0, 0.0]
]

#criterions is normalized weights matrix
criterions = [
  [0.0, 0.0, 0.0],
  [0.0, 0.0, 0.0],
  [0.0, 0.0, 0.0],
  [0.0, 0.0, 0.0]
]

# sumMinMaxDiff, minMaxDiff = [ Bali[minDiff, Maxdiff], Bibione[minDiff, Maxdiff], Karibik[minDiff, Maxdiff]]
sumMinMaxDiff = [
  [0.0, 0.0],
  [0.0, 0.0],
  [0.0, 0.0]
]

minMaxDiff = [
  [0.0, 0.0],
  [0.0, 0.0],
  [0.0, 0.0]
]

# final = [ Bali, Bibione, Karibik ]
final = [0.0, 0.0, 0.0]


# Caliculate weights
for i in range(len(dataset)): # no. of criterias
  for j in range(len(dataset[i])): # no. of cities
    weights[i][j] = float(sum(dataset[i][j])/len(dataset[i]))

print("weight matrix is ")
print('\n'.join([''.join(['{:4}'.format(item) for item in row]) for row in weights]))

# Normalized matrix
for i in range(len(weights)):
  for j in range(len(weights[i])):
    criterions[i][j] = math.pow(weights[i][j], 2) / sum(weights[i])

print("criteria matrix is ")
print('\n'.join([''.join(['{:20}'.format(item) for item in row]) for row in criterions]))
# Calcurate min/max differences and add up
for i in criterions:
  for j in range(len(i)):
    print math.pow(i[j]-min(i), 2)
    sumMinMaxDiff[j][0] += math.pow(i[j]-min(i), 2)
    sumMinMaxDiff[j][1] += math.pow(i[j]-max(i), 2)

print("sumMinMaxDiff matrix is ")
print('\n'.join([''.join(['{:20}'.format(item) for item in row]) for row in sumMinMaxDiff]))

# calculate Sqrt
for i in range(len(sumMinMaxDiff)):
  for j in range(len(sumMinMaxDiff[i])):
    minMaxDiff[i][j] = math.sqrt(sumMinMaxDiff[i][j])

# Compute the realtive closest solution
for i in range(len(minMaxDiff)):
  final[i] = minMaxDiff[i][0]/sum(minMaxDiff[i])

print("final matrix is ", final)

print "Ideal Alternative -> Negative Ideal Alternative"
print places[final.index(max(final))]

if __name__ == "__main__":
m_alternatives = 2;
n_criteria = 3;
dataset = np.empty((m_alternatives,n_criteria))
dataset = [[2,4,6],
           [5,7,6]]

# weights = [[0]*n_criteria] *m_alternatives;
normalizedWeights = normalize(dataset,norm='l2', axis=0); #normalize per criteria

weights = np.array([1,1,1], dtype='float64')

weightsNormalized = normalize(weights, norm='l1', axis=1)

weightNormalizedDataset = np.multiply(weightsNormalized, dataset)

bestVector = [weightNormalizedDataset[:,0].min(),weightNormalizedDataset[:,1].max(),weightNormalizedDataset[:,2].min()]
worstVector = [weightNormalizedDataset[:,0].max(),weightNormalizedDataset[:,1].min(),weightNormalizedDataset[:,2].max()]

L2DistanceBestWorst = np.empty((m_alternatives, 2)) # 2 for best and worst
def myfunction( x ):
  return (np.linalg.norm(x-bestVector), np.linalg.norm(x-worstVector))
L2DistanceBestWorst = np.apply_along_axis( myfunction, axis=1, arr=weightNormalizedDataset )

similarity =  np.apply_along_axis( lambda row: row[0]/(row.sum()), axis=1, arr=L2DistanceBestWorst )

print("returning ", np.argmin(similarity))


