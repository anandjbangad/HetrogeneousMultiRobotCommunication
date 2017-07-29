from platypus import NSGAII, Problem, Real

# from platypus.algorithms import NSGAII
# from platypus.core import Problem
# from platypus.types import Real


class allocation(Problem):

    def __init__(self):
        super(allocation, self).__init__(3, 3, 1)
        self.types[:] = [Real(-10, 10), Real(-10, 10), Real(-10, 10)]
        self.constraints[:] = "<=0"

    def evaluate(self, solution):
        x = solution.variables[0]
        y = solution.variables[1]
        z = solution.variables[2]
        solution.objectives[:] = [
            6 * x / (1 + x), 7 * y / (1 + 1.5 * y), 8 * z / (1 + 0.5 * z)]
        solution.constraints[:] = [x + y + z - 6]


algorithm = NSGAII(allocation())
algorithm.run(10)

for solution in algorithm.result:
    print(solution.objectives)
