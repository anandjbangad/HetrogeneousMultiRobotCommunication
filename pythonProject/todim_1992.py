#!/usr/bin/env python2
# -*- coding: utf-8 -*-
"""
Created on Wed Jun  7 01:49:33 2017

@author: sbhal
"""
import numpy as np
from sklearn.preprocessing import normalize
import logging, sys



class todimClass:
    def __init__(self, data, n_alternatives, m_criteria, minMaxArray, weights=None, theta=None):

        if weights is None:
            self.weights = np.full( m_criteria, fill_value=float(1)/m_criteria)
            self.weights = (normalize(self.weights.reshape(1,-1), norm='l1', axis=1)).squeeze() #normalize weights
        else:
            # self.weights = (normalize(weights.reshape(1,-1), norm='l1', axis=1)).squeeze() #normalize weights
            self.weights = (normalize([weights], norm='l1', axis=1)).squeeze()  # normalize weights
        if theta is None:
            self.theta = 2.5
        else:
            self.theta = theta
        self.n_alternatives = n_alternatives
        self.m_criteria = m_criteria
        self.data = np.asarray(data, dtype=np.float64).reshape(n_alternatives,m_criteria)
        #apply minMaxArray
        for idx, val in enumerate(minMaxArray):
            if val == "min":
                self.data[:, idx] = -self.data[:, idx]
        self.data = normalize(self.data, norm='l1', axis=0) #normalize data
        logging.debug("Input data is \n %s", self.data)
        logging.debug("Weights are %s", self.weights)
        self.DeltaDominanceMatrix = np.empty((self.n_alternatives,self.n_alternatives), dtype=np.float64)
        self.globalMeasure = np.empty(self.n_alternatives, dtype=np.float64)

    def phiPerCriteria(self, i,j,c):
        #comparision of two alternatives Ai & Aj per single criteria C
        differenceRealValueIJ = self.data[i,c] - self.data[j,c]
        if (differenceRealValueIJ >0):
                return np.sqrt(self.weights[c] * differenceRealValueIJ)
        elif(differenceRealValueIJ == 0):
                return 0;
        elif(differenceRealValueIJ < 0):
            return (-1/self.theta) * np.sqrt(self.weights[c] * abs(differenceRealValueIJ))


    #final dominance of alternative Ai over Aj
    def finalDominanceAionAj(self, i,j):
        # Dominance/Comparision b/w two Alternatives = function(each category comparision)
        #summation of phiPerCategory
        sum = 0
        for crit in range(self.m_criteria):
            temp = self.phiPerCriteria(i,j, crit)
            logging.debug("phi Ai/Aj %d/%d  is %s for criteria %s",i,j, temp,crit)
            sum += temp
        return sum

    def createDominationMatrix(self):
        for alternative in range(self.n_alternatives):
            for crit in range(self.n_alternatives):
                self.DeltaDominanceMatrix[alternative, crit] = self.finalDominanceAionAj(alternative, crit);
        logging.debug("DelataDominance Matrix(Alt,Alt) is \n %s", self.DeltaDominanceMatrix)

    def getGlobalMeasure (self):
            # DeltaDominanceMatrix = self.createDominationMatrix()
            self.createDominationMatrix()
            #denormalized global measure
            dglobalMeasure = self.DeltaDominanceMatrix.sum(axis=1)
            logging.debug("dglobalMeasure Matrix(Alt,Alt) is %s", dglobalMeasure)
            for i in range(self.n_alternatives):
                self.globalMeasure[i] = (dglobalMeasure[i] - dglobalMeasure.min()) / (dglobalMeasure.max() - dglobalMeasure.min())
            logging.debug("global Measure Matrix(Alt,1) is %s", self.globalMeasure)
            return np.argmax(self.globalMeasure)
    
if __name__ == "__main__":
    logging.basicConfig(stream=sys.stderr, level=logging.DEBUG)  # logging.ERROR
    np.set_printoptions(precision=2, suppress=True)

    # n_alternatives = 15;
    # m_criteria = 8;
    # dataset = np.loadtxt("sample1.txt", dtype=np.float64)
    # weights = dataset[0,:]
    # theta = dataset[1,0]
    # data = dataset[2:,:].flatten()

    n_alternatives = 3;
    m_criteria = 2;
    data = [9,5,
            7, 7,
            5,9]
    theta = 2.5

    #normalize weights
    #weights = normalize(weights.reshape(1,-1), norm='l1', axis=1)
    # print("normalized weights is", weights)
    #normalize data
    #data = normalize(data, norm='l1', axis=0)
    # print("normalized data is", data)
    
    myTodim = todimClass(data, n_alternatives,m_criteria, ["max", "min"])

    finalOutput = myTodim.getGlobalMeasure()

    print(finalOutput)
    
    
    
    