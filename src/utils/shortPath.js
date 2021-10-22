export function shortPath(graph,start,finish) {
    const costs = {}
    const processed = [String(start)]
    const path = {}
    let neighbors = {}
    let isFound = false
    Object.keys(graph).forEach(node => {
      let value = graph[start][node]
      costs[node] = value || Infinity
    })
    let node = findLowestNodeCost(costs,processed)
    while(node) {
      const cost = costs[node]
      neighbors = graph[node]
      Object.keys(neighbors).forEach(neighbor => {
        let newCost = cost + neighbors[neighbor]
        if(newCost < costs[neighbor]) {
          if(neighbor === String(start)) {
            path[node] = neighbor
          } else {
            costs[neighbor] = newCost
            path[neighbor] = node
          }
        }
      })
      if(node === String(finish)) {
        isFound = true
        break
      }
      processed.push(node)
      node = findLowestNodeCost(costs,processed)
    }
    return [costs,path,isFound]
  }

  function findLowestNodeCost(costs,processed) {
    let lowestCost = Infinity
    let lowestNode
    
    Object.keys(costs).forEach(node => {
      let cost = costs[node]
      if(cost < lowestCost && !processed.includes(node)) {
        lowestCost = cost
        lowestNode = node
      }
    })
    return lowestNode
  }