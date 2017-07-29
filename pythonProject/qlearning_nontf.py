#!/usr/bin/env python2
# -*- coding: utf-8 -*-
"""
Created on Thu Jun  8 19:14:33 2017

@author: sbhal
"""

import numpy as np
import pandas as pd

class getWeights:
    def __init__(self, m_criteria, initialWeights=None):
        if initialWeights == None:
            self.weights = np.full(m_criteria, 3) #assign dtype
        else:
            self.weights = initialWeights
        self.weightBins = 3 #.3 .7. .5
        self.e = 0.5
        self.lr = .8
        self.y = .95
        self.m_criteria = m_criteria
        self.actionStatesCount = 3 #+-0
        self.QcolNames = []
        for i in range(self.m_criteria):
            for j in ['+','-','0']:
                self.QcolNames.append("w"+str(i)+j)
        print("QcolNames creates is", self.QcolNames)
        self.QrowNames = []
        for i in  ["3", "5", "7"]:
            for j in ["3", "5", "7"]:
                        self.QrowNames.append(i + j)
        print("QrowNames creates is", self.QrowNames)
        # initialize Q table
        # self.Qtable =  np.zeros([self.weightBins^self.m_criteria, self.m_criteria* self.actionStatesCount])
        data = np.zeros((pow(self.weightBins , self.m_criteria), self.m_criteria * self.actionStatesCount))
        self.Qtable = pd.DataFrame(data, index=self.QrowNames, columns=self.QcolNames)
        self.currState = "33"

    def learn(self, currState, action, reward, finalState): #curState ----action----> finalState (+reward)
        #update Q table
        value = self.Qtable.loc[currState, action]
        value2 = self.Qtable.loc[finalState].max()

        self.Qtable.loc[currState, action] = value + self.lr * (reward + self.y * value2 - value)
        self.currState = finalState
        print(self.Qtable, "@ updated at state", self.currState)

    def currToFinalState (self, a, c): #w3+ -> w5
        c_num = list(map(int, c))
        if a[2] == "+":
            c_num[int(a[1])] = min(7, c_num[int(a[1])]+2)
        else:
            c_num[int(a[1])] = max(3, c_num[int(a[1])] - 2)
        return "".join(map(str,c_num))

    def update(self, action, latency):
        #reward = 1/latency
        reward = 0 if latency == 0 else 1 / latency
        finalState = self.currToFinalState(action, self.currState)
        self.learn (self.currState, action, reward, finalState)


    def choose_action(self, currState):
        #verify if currState has correct format
        if np.random.rand(1) < self.e:
            # print ("YaY! Random Action!!!!!!!!")
            return  self.QcolNames[np.random.randint(0, 5)]
        else:
            return self.Qtable.loc[:self.currState].idxmax(1).values[0]

if __name__ == "__main__":
    myIns = getWeights(m_criteria=2)
    action = myIns.choose_action("33")
    print("Choose Action", action)
    myIns.update(action, 500)