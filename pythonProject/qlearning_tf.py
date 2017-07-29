#!/usr/bin/env python2
# -*- coding: utf-8 -*-
"""
Created on Thu Jun  8 19:14:33 2017

@author: sbhal
"""

import numpy as np
import pandas as pd
import random
import tensorflow as tf

class qlearningTF:
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
        # initialize Q table
        self.currState = "33"

        self.Qrows = pow(self.weightBins,self.m_criteria)
        self.Qcols = self.m_criteria* self.actionStatesCount

        # These lines establish the feed-forward part of the network used to choose actions
        self.inputs1 = tf.placeholder(shape=[1, self.Qrows], dtype=tf.float32)
        #self.W = tf.Variable(tf.random_uniform([self.Qrows, self.Qcols], 0, 0.01))
        self.W = tf.Variable(tf.random_uniform([self.Qrows, self.Qcols], 0, 0.00))
        self.Qout = tf.matmul(self.inputs1, self.W)
        self.predict = tf.argmax(self.Qout, 1)
        # Below we obtain the loss by taking the sum of squares difference between the target and prediction Q values.
        self.nextQ = tf.placeholder(shape=[1, self.Qcols], dtype=tf.float32)
        loss = tf.reduce_sum(tf.square(self.nextQ - self.Qout))
        trainer = tf.train.GradientDescentOptimizer(learning_rate=0.1)
        self.updateModel = trainer.minimize(loss)
        self.sess = tf.Session()
        self.sess.run(tf.initialize_all_variables())

    def learn(self, s, a, reward, s1): #curState ----action----> finalState (+reward)
        allQ = self.sess.run(self.Qout, feed_dict={self.inputs1: np.identity(self.Qrows)[s:s + 1]})
        value2 = np.max(self.sess.run(self.Qout,feed_dict={self.inputs1:np.identity(self.Qrows)[s1:s1+1]}))
        allQ[0, a] = reward + self.y * value2
        _, W1 = self.sess.run([self.updateModel, self.W], feed_dict={self.inputs1: np.identity(self.Qrows)[s:s + 1], self.nextQ: allQ})

        # print(self.sess.run(self.W), " weight updated @ state", self.currState)
        self.currState = self.state_num_to_string(s1)


    def currToFinalState (self, a, c):
        c_num = list(map(int, c))
        if a[2] == "+":
            c_num[int(a[1])] = min(7, c_num[int(a[1])]+2)
        else:
            c_num[int(a[1])] = max(3, c_num[int(a[1])] - 2)
        return "".join(map(str,c_num))

    def update(self, action, latency):
        reward = 0 if latency==0 else 1/latency
        finalState = self.currToFinalState(action, self.currState)
        s = self.state_string_to_num(self.currState)
        s1 = self.state_string_to_num(finalState)
        a = self.action_string_to_num(action)
        self.learn (s, a, reward, s1)

    def choose_action(self, currState):
        #verify if currState has correct format
        s = self.state_string_to_num(currState)
        if np.random.rand(1) < self.e:
            # print("Random action Chosen")
            return self.action_num_to_string(random.randrange(0, self.Qcols))
        else:
            a = np.argmax(self.sess.run(self.Qout,feed_dict={self.inputs1:np.identity(self.Qrows)[s:s+1]}))
            return self.action_num_to_string(a)
    def state_string_to_num(self, s):
        dict = {'3': 0,
                '5': 1,
                '7': 2}
        sum =0
        for i, c in enumerate(reversed(s)):
            sum += pow(self.weightBins,i) * dict[c]
        return sum

    def state_num_to_string(self, num):
        dict = {'0':'3',
                '1':'5',
                '2':'7'}
        mynum = num
        strr = ""
        string = ""
        for i in reversed(range(0,self.m_criteria)):
            strr += str(mynum // pow(self.weightBins, i))
            mynum = mynum % pow(self.weightBins, i)
        for i,c in enumerate(strr):
            string += dict[strr[i]]
        return string

    def action_num_to_string(self, num):
        dict = {0: "+",
                1: "-",
                2: "0"}
        quotient = num // self.weightBins
        remainder = num % self.weightBins
        return "w"+ str(quotient) + dict[remainder]
    def action_string_to_num(self, s):
        dict = { "+": 0,
                 "-": 1,
                 "0": 2}
        return (int(s[1]) * self.weightBins) + dict[s[2]]


if __name__ == "__main__":
    myIns = qlearningTF(m_criteria=2)
    print (myIns.state_string_to_num("33"))
    print(myIns.state_string_to_num("53"))
    print(myIns.state_string_to_num("77"))
    print(myIns.action_num_to_string(0))
    print(myIns.action_num_to_string(4))

    print(myIns.state_num_to_string(0))
    print(myIns.state_num_to_string(3))
    print(myIns.state_num_to_string(8))


    print("From here:")
    action = myIns.choose_action("33")
    print("Action given is", action)
    myIns.update(action, 300)
    print("new")
    action = myIns.choose_action("77")
    myIns.update(action, 300)
    print(myIns.choose_action("33"))
