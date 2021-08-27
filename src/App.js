import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import classes from './App.module.css';

const initialState = {
  dots:[],
  graph: {},
  context: null,
  mode:null,
  clickedDot:null,
  startDot:null,
  finishDot:null,
  isCalculated:false
}

const reducer = (state,action) => {
  switch(action.type) {
    case "clear": 
      return {...initialState,context:state.context}
    case "changeMode":
      return {...state,mode:action.payload.mode === state.mode ? null : action.payload.mode}
    case "setContext":
      return {...state,context:action.payload.context}
    case "addDots":
      return {...state,dots:[...state.dots,action.payload.dot]}
    case "startDot":
      return {...state,startDot:action.payload.dot}
    case "finishDot":
      return {...state,finishDot:action.payload.dot}
    case "clickDot":
      if(action.payload.position === null) {
        const firstDotIndex = state.dots.findIndex(el => {
          if(el[0] === state.clickedDot[0] && el[1] === state.clickedDot[1]) {
            return true
          }
          return false
        })
        
        const secondDotIndex = state.dots.findIndex(el => {
          if(el[0] === action.payload.second[0] && el[1] === action.payload.second[1]) {
            return true
          }
          return false
        })
        const x = state.clickedDot[0] - action.payload.second[0]
        const y = state.clickedDot[1] - action.payload.second[1]
        const distance = Math.sqrt(Math.pow(x,2) + Math.pow(y,2))

        const newGraph = {...state.graph}
        newGraph[firstDotIndex] = {...state.graph[firstDotIndex],[secondDotIndex]:distance}
        newGraph[secondDotIndex] = {...state.graph[secondDotIndex],[firstDotIndex]:distance}

        return {...state,clickedDot: action.payload.position,graph:newGraph}
      }
      return {...state,clickedDot: action.payload.position}
    case "setCalculate":
      return {...state,isCalculated:action.payload.bool}
    default :
      return state
  }
}


function App() {
  const [state,dispatch] = useReducer(reducer,initialState)
  const canvasRef = useRef(null)
  const contextRef = useRef(null)
  const stateRef = useRef(null)

  stateRef.current = state 
  contextRef.current = state.context

  const RADIUS = 25

  function clickButtonHandler(number) {
    dispatch({type:"changeMode",payload: {mode:number}})
  }
  
  const canvasClickHanler = useCallback((e) => {
    const ctx = contextRef.current
    const position = [e.offsetX,e.offsetY]
    
    if(stateRef.current.isCalculated) {
      clearCanvas()
    }

    if(stateRef.current.mode === 1) {
      const isBusy = isClickDot(position) ? true : false

      if(isBusy) {
        alert("Place is taken")
        return
      }

      drawArc([position],"black")
      dispatch({type:"addDots",payload:{dot:[...position]}})
      return
    }

    if(stateRef.current.mode === 2) {
      const positionDot = isClickDot(position)
      if(!positionDot) {
        alert("Click on the dots")
        return
      }

      if(!stateRef.current.clickedDot && positionDot) {
        dispatch({type:"clickDot",payload:{position:positionDot}})
      } else if(positionDot) {
        ctx.beginPath()
        ctx.strokeStyle = "black"
        ctx.lineWidth = 5
        ctx.moveTo(stateRef.current.clickedDot[0],stateRef.current.clickedDot[1])
        ctx.lineTo(positionDot[0],positionDot[1])
        ctx.stroke()
        ctx.closePath()
        dispatch({type:"clickDot",payload:{position:null,second:positionDot}})
      }
      return
    }

    if(stateRef.current.mode === 3) {
      let startDot = stateRef.current.startDot
      let finishDot = stateRef.current.finishDot

      if(startDot === null) {
        const index = findDotIndex(position)
        
        if(typeof(index) === "number") {
          dispatch({type:"startDot",payload:{dot:index}})
        }
        return
      }

      if(finishDot === null) {
        const index = findDotIndex(position)

        if(typeof(index) === "number") {
          dispatch({type:"finishDot",payload:{dot:index}})
        }
        finishDot = index
      }
      
      const [costs,path,isFound] = shortPath(stateRef.current.graph,startDot,finishDot)

      dispatch({type:"setCalculate",payload:{bool:true}})

      if(!isFound) {
        alert("Path not found")
        return
      }

      const convertedPath = convertPath(path,startDot,finishDot)

      //draw red lines instead of black lines 
      ctx.beginPath()
      ctx.strokeStyle = "red"
      ctx.lineWidth = 5
      ctx.moveTo(stateRef.current.dots[convertedPath[0]][0],stateRef.current.dots[convertedPath[0]][1])
      for(let i = 1; i<convertedPath.length;i++) {
        ctx.lineTo(stateRef.current.dots[convertedPath[i]][0],stateRef.current.dots[convertedPath[i]][1])
        ctx.stroke()
      }
      ctx.closePath()

      //draw red circle instead of black circle 
      drawArc([[stateRef.current.dots[convertedPath[0]][0],stateRef.current.dots[convertedPath[0]][1]]],"red")

      for(let i = 1; i < convertedPath.length;i++) {
        drawArc([[stateRef.current.dots[convertedPath[i]][0],stateRef.current.dots[convertedPath[i]][1]]],"red")
      }
    }

  },[])
  
  function drawArc(positionArr,color) {
    const ctx = contextRef.current
    positionArr.forEach(el => {
      ctx.beginPath()
      ctx.fillStyle = color
      ctx.arc(el[0],el[1],RADIUS, 0, Math.PI * 2)
      ctx.fill()
      ctx.closePath()
    })
  }

  function findDotIndex(position) {
    const index = stateRef.current.dots.findIndex(el => {
      const x = position[0] - el[0]
      const y = position[1] - el[1]
      const distance = Math.sqrt(Math.pow(x,2) + Math.pow(y,2))
      
      if(distance <= RADIUS * 2) {
        return true
      }
      return false
    })
    return index
  }
  
  function isClickDot(position) {
    const tempArr = stateRef.current.dots.filter(el => {
      const x = Math.pow(position[0] - el[0],2)
      const y = Math.pow(position[1] - el[1],2)
      if(Math.sqrt(x+y) <= RADIUS) {
        return true
      }
      return false
    })

    return tempArr[0]
  }

  function clearCanvas() {
    const ctx = contextRef.current

    ctx.clearRect(0,0,canvasRef.current.width,canvasRef.current.height)
    dispatch({type:'clear'})
  }

  function convertPath(path,start,finish) {
    let curEl = String(finish)
    const result = []
    
    while(String(curEl) !== String(start)) {
      result.unshift(Number(curEl))
      curEl = Number(path[curEl])
    }
    
    result.unshift(Number(start))
    return result
  }

  function shortPath(graph,start,finish) {
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

  useEffect(() => {
    canvasRef.current.width = 1800
    canvasRef.current.height = 850
    canvasRef.current.style.width = 1800 + "px"
    canvasRef.current.style.height = 850 + "px"
    const ctx = canvasRef.current.getContext('2d')
    dispatch({type:"setContext",payload:{context:ctx}})
    canvasRef.current.addEventListener("click",(e) => canvasClickHanler(e))
  },[])

  return (
    <div className={classes.app}>
      <header className = {classes.app__header}>
        <button onClick = {clearCanvas}>Clear</button>
        <button className = {`${state.mode === 1 && classes.app__button_active} `} onClick = {() => clickButtonHandler(1)}>Dots</button>
        <button className = {`${state.mode === 2 && classes.app__button_active} `} onClick = {() => {
          alert("Connect the dots")
          clickButtonHandler(2)
        }}>Connections</button>
        <button className = {`${state.mode === 3 && classes.app__button_active} `} onClick = {() => {
          alert("Choose start and finish")
          clickButtonHandler(3)
        }}>Calculate</button>
      </header>
      <main className = {classes.app__main}>
        <canvas ref = {canvasRef}></canvas>
      </main>
    </div>
  );
}

export default App;
