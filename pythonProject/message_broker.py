#!/usr/bin/env python
import pika
try:
  import simplejson as json
except:
  import json
import topsis_rpy2 as topsis
from todim_1992 import todimClass
import logging, sys
from random import randint
from qlearning_nontf import getWeights
from qlearning_tf import qlearningTF

# logger = logging.getLogger('myapp')
# hdlr = logging.FileHandler('/var/tmp/myapp.log')
# logger.addHandler(hdlr)
# logger.setLevel(logging.WARNING)
import qlearning_nontf
import time

import argparse


# ALGO= "random"
# ALGO= "topsis"
# ALGO= "todim"


# QLEARN="no"
# QLEARN="nontf"
# QLEARN="tf"

lastAction = "w00"
weights = [3,3]
getWeights = getWeights(2)
qlearnTF = qlearningTF(2)

def callback(ch, method, properties, body):
    # enterTime = time.time()
    #time.sleep(0.4)
    global weights
    #print(" [x] Received %r" % body)
    #algo = "todim"

    n_alternatives = json.loads(body)['n_alternatives']
    m_cri = json.loads(body)['m_criterias']
    orig_matrix = json.loads(body)['matrix']

    #new params
    new_cri = 2
    matrix = [None]*(n_alternatives * new_cri)
    new_alt = n_alternatives



    for alt in range(json.loads(body)['n_alternatives']):
        for cri in range(json.loads(body)['m_criterias']):
            if cri == 0: #1st criteria CPU
                matrix[alt * new_cri + cri] = orig_matrix[alt * m_cri + cri]
            elif cri == 1: #2nd criteria distance vector
                if alt ==0: #local
                    matrix[alt * new_cri + cri] = 0.4
                elif alt ==1: #cloud
                    matrix[alt * new_cri + cri] = 0.5
                else: #neighbors
                    matrix[alt * new_cri + cri] = 0.6


    if ALGO == "todim":
        todim = todimClass(matrix, new_alt, new_cri, ["min", "min"], weights)
        #todim = todimClass(json.loads(body)['matrix'], json.loads(body)['n_alternatives'],json.loads(body)['m_criterias'], ["min", "max", "min", "min"])
        res = todim.getGlobalMeasure()
    elif ALGO == "topsis":
        res = topsis.callAlgorithm(matrix, new_alt, new_cri, ["min", "min"],weights)
        #res = topsis.callAlgorithm(json.loads(body)['matrix'], json.loads(body)['n_alternatives'], json.loads(body)['m_criterias'], ["min", "max", "min", "min"])
    elif ALGO == "random":
        res = randint(0, new_alt-1)
    else:
        sys.exit()

    # logging.info("[%s] -> Offload to %d/%d ------ %s ", json.loads(body)['type'],res, json.loads(body)['n_alternatives'],json.loads(body)['matrix'])
    logging.info("[%s] -> Offload to %d/%d ------ %s ", json.loads(body)['type'],res, new_alt, matrix)

    jsonMsg = {
        "offloadTo": res
        #"offloadTo": 0
    }
    ch.basic_publish(exchange='',
                          routing_key=properties.reply_to,
                          body=json.dumps(jsonMsg),
                          properties=pika.BasicProperties(
                              correlation_id=properties.correlation_id,
                          ))
    # logger.error(time.time() - enterTime);

def latency_upd(ch, method, properties, body):
    if 'latency' in json.loads(body):
        latency = json.loads(body)['latency']
        global lastAction, getWeights, weights, qlearnTF
        print("----> latency ", latency, weights)
        if QLEARN == "nontf":
            getWeights.update(lastAction, latency)
            #lastAction = getWeights.choose_action(latency)
            lastAction = getWeights.choose_action(''.join(str(e) for e in weights))
        elif QLEARN == "tf":
            qlearnTF.update(lastAction, latency)
            lastAction = qlearnTF.choose_action(''.join(str(e) for e in weights))
        elif QLEARN == "no":
            return;
        else:
            sys.exit()
        if lastAction[2] == "+": #w0+
            weights[int(lastAction[1])] = min(weights[int(lastAction[1])] + 2, 7)
        elif lastAction[2] == "-": #w0+
            weights[int(lastAction[1])] = max(weights[int(lastAction[1])] - 2, 3)

if __name__ == "__main__":
    logging.basicConfig(stream=sys.stderr, level=logging.INFO)
    # logging.basicConfig(stream=sys.stderr, level=logging.DEBUG)

    parser = argparse.ArgumentParser(description='This')
    parser.add_argument('-a', '--algo', help='Algorithm', required=True)
    parser.add_argument('-q', '--ql', help='Qleanring true/false', required=True)
    args = parser.parse_args()

    ## show values ##
    print("Input file: %s" % args.algo)
    print("Output file: %s" % args.ql)

    if args.algo not in ["random", "topsis", "todim"]:
        sys.exit()

    if args.ql not in ["no", "nontf", "tf"]:
        sys.exit()

    ALGO = args.algo
    QLEARN = args.ql


    connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
    channel = connection.channel()

    channel.queue_declare(queue='python_req')

    channel.basic_consume(callback,
                          queue='python_req',
                          no_ack=True)

    channel.queue_declare(queue='latency_upd')

    channel.basic_consume(latency_upd,
                          queue='latency_upd',
                          no_ack=True)


    print(' [*] Waiting for messages. To exit press CTRL+C')
    channel.start_consuming()
