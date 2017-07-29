#!/usr/bin/env python2
# -*- coding: utf-8 -*-
"""
Created on Wed Jun  7 01:49:33 2017

@author: sbhal
"""
import numpy as np
from sklearn.preprocessing import normalize

class todim:
    def __init__(self, data, n_alternatives, m_criteria, weights=None, theta=None):

        if weights is None:
            self.weights = np.full( m_criteria, fill_value=1/m_criteria)
        else:
            self.weights = (normalize(weights.reshape(1,-1), norm='l1', axis=1)).squeeze() #normalize weights
        if theta is None:
            theta = 2.5
        else:
            self.theta = theta
        self.n_alternatives = n_alternatives
        self.m_criteria = m_criteria
        self.data = np.asarray(data).reshape(n_alternatives,m_criteria)
        self.data = normalize(self.data, norm='l1', axis=0) #normalize data
        self.DeltaDominanceMatrix = np.empty_like(self.data, dtype=np.float64)
        self.globalMeasure = np.empty(self.n_alternatives, dtype=np.float64)

    def phiPerCriteria(self, i,j,c):
        #comparision of two alternatives Ai & Aj per single criteria C
        differenceRealValueIJ = self.data[i,c] - self.data[j,c]
        if (differenceRealValueIJ >0):
                return np.sqrt(self.weights[c] * differenceRealValueIJ)
        elif(differenceRealValueIJ == 0):
                return 0;
        elif(differenceRealValueIJ < 0):
            return (-1/theta) * np.sqrt(self.weights[c] * abs(differenceRealValueIJ))


    #final dominance of alternative Ai over Aj
    def finalDominanceAionAj(self, i,j):
        # Dominance/Comparision b/w two Alternatives = function(each category comparision)
        #summation of phiPerCategory
        sum = 0
        for crit in range(self.m_criteria):
            sum += self.phiPerCriteria(i,j, crit)
        # print ("m is", sum)
        return sum

    def createDominationMatrix(self):
        for alternative in range(self.n_alternatives):
            for crit in range(self.m_criteria):
                self.DeltaDominanceMatrix[alternative, crit] = self.finalDominanceAionAj(alternative, crit);
        #return self.DeltaDominanceMatrix

    def getGlobalMeasure (self):
            # DeltaDominanceMatrix = self.createDominationMatrix()
            self.createDominationMatrix()
            aux = self.DeltaDominanceMatrix.sum(axis=1)
            for i in range(n_alternatives):
                self.globalMeasure[i] = (aux[i] - aux.min()) / (aux.max() - aux.min())
            return self.globalMeasure
    
if __name__ == "__main__":
    # n_alternatives = 15;
    # m_criteria = 8;
    # dataset = np.loadtxt("sample1.txt", dtype=np.float64)
    # weights = dataset[0,:]
    # theta = dataset[1,0]
    # data = dataset[2:,:].flatten()

    n_alternatives = 2;
    m_criteria = 3;
    data = [0.9,10,300,0.1,300,6]
    theta = 2.5

    #normalize weights
    #weights = normalize(weights.reshape(1,-1), norm='l1', axis=1)
    # print("normalized weights is", weights)
    #normalize data
    #data = normalize(data, norm='l1', axis=0)
    # print("normalized data is", data)
    
    myTodim = todim(data, n_alternatives,m_criteria)

    finalOutput = myTodim.getGlobalMeasure()

    print(finalOutput)
    
    
    
    